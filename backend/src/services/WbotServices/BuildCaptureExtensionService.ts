import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
import { spawn } from "child_process";

import AppError from "../../errors/AppError";
import uploadConfig from "../../config/upload";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import GetPublicSettingService from "../SettingServices/GetPublicSettingService";
import UpdateSettingService from "../SettingServices/UpdateSettingService";

const SOURCE_REPO = "zapitu/zapitu-wasession-capture";
const SOURCE_TARBALL = `https://api.github.com/repos/${SOURCE_REPO}/tarball/main`;
const OUTPUT_FILENAME = "capture-extension.zip";

let activeBuild: Promise<void> | null = null;

const PUBLIC_SETTINGS_COMPANY_ID = 1;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._ -]/g, "").trim() || "extension";
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "pipe" });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on("data", chunk => stdoutChunks.push(chunk));
    child.stderr?.on("data", chunk => stderrChunks.push(chunk));

    child.on("error", reject);

    child.on("close", code => {
      if (code === 0) {
        resolve();
        return;
      }

      const stdout = Buffer.concat(
        stdoutChunks as unknown as Uint8Array[]
      ).toString("utf-8");
      const stderr = Buffer.concat(
        stderrChunks as unknown as Uint8Array[]
      ).toString("utf-8");

      logger.debug({ command, args, code, stdout, stderr }, "Command failed");

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code}. ${
            stderr || stdout
          }`.slice(0, 500)
        )
      );
    });
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;

    client
      .get(url, { headers: { "User-Agent": "ticketz" } }, response => {
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          const location = response.headers.location;
          if (location) {
            downloadFile(location, dest).then(resolve, reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`Download failed with status ${response.statusCode}`)
          );
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () =>
          file.close(err => (err ? reject(err) : resolve()))
        );
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

async function build(companyId: number, frontendUrl?: string): Promise<void> {
  const appName =
    (await GetPublicSettingService({ key: "appName" })) || "ticketz";
  const favicon = await GetPublicSettingService({ key: "appLogoFavicon" });
  const title = `${appName} WA Session Capture`;

  const effectiveFrontendUrl = frontendUrl || process.env.FRONTEND_URL;
  if (!effectiveFrontendUrl) {
    throw new AppError("ERR_FRONTEND_URL_NOT_CONFIGURED", 400);
  }

  const appHost = effectiveFrontendUrl.replace(/\/+$/, "");
  let workDir = "";

  try {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "wasession-capture-"));
    const tarball = path.join(workDir, "source.tar.gz");

    await downloadFile(SOURCE_TARBALL, tarball);
    await runCommand(
      "tar",
      ["-xzf", tarball, "-C", workDir, "--strip-components=1"],
      workDir
    );
    fs.unlinkSync(tarball);

    const envContent = `EXTENSION_TITLE=${title}\nAPP_HOSTS=${appHost}/*\n`;
    fs.writeFileSync(path.join(workDir, ".env"), envContent);

    const iconsDir = path.join(workDir, "public", "icons");

    if (favicon) {
      const faviconPath = path.join(uploadConfig.directory, favicon);
      if (fs.existsSync(faviconPath)) {
        fs.mkdirSync(iconsDir, { recursive: true });
        fs.copyFileSync(faviconPath, path.join(iconsDir, "logo.jpg"));
      }
    }

    // The upstream package script expects public/icons/logo.jpg as its default
    // icon source. If no custom favicon is provided we still need that file to
    // exist, so fall back to one of the shipped PNG icons.
    const defaultIcon = path.join(iconsDir, "logo.jpg");
    if (!fs.existsSync(defaultIcon)) {
      fs.mkdirSync(iconsDir, { recursive: true });
      const shippedIcon = path.join(iconsDir, "icon128.png");
      if (fs.existsSync(shippedIcon)) {
        fs.copyFileSync(shippedIcon, defaultIcon);
      }
    }

    await runCommand("npm", ["install"], workDir);
    await runCommand("npm", ["run", "package"], workDir);

    const packagedName = `${sanitizeFileName(title)}.zip`;
    const builtZip = path.join(workDir, "dist", packagedName);

    if (!fs.existsSync(builtZip)) {
      throw new Error(`Packaged extension not found at ${builtZip}`);
    }

    const destPath = path.join(uploadConfig.directory, OUTPUT_FILENAME);
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    fs.copyFileSync(builtZip, destPath);

    await UpdateSettingService({
      key: "extensionDownloadUrl",
      value: OUTPUT_FILENAME,
      companyId: PUBLIC_SETTINGS_COMPANY_ID
    });

    const io = getIO();
    io.to(`company-${companyId}-admin`).emit(
      `company-${companyId}-extensionBuild`,
      {
        status: "success",
        url: OUTPUT_FILENAME,
        title
      }
    );
  } catch (err) {
    logger.error({ err, companyId }, "Failed to build capture extension");

    const io = getIO();
    io.to(`company-${companyId}-admin`).emit(
      `company-${companyId}-extensionBuild`,
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown build error"
      }
    );
  } finally {
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        logger.debug(
          { cleanupErr, workDir },
          "Failed to cleanup extension build dir"
        );
      }
    }
  }
}

export function startBuildCaptureExtension(
  companyId: number,
  frontendUrl?: string
): void {
  if (activeBuild) {
    throw new AppError("ERR_EXTENSION_BUILD_IN_PROGRESS", 409);
  }

  activeBuild = build(companyId, frontendUrl).finally(() => {
    activeBuild = null;
  });
}
