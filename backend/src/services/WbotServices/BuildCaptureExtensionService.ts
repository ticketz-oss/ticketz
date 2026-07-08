import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
import { spawn } from "child_process";

import { Jimp } from "jimp";
import { Resvg } from "@resvg/resvg-js";

import AppError from "../../errors/AppError";
import uploadConfig from "../../config/upload";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import GetPublicSettingService from "../SettingServices/GetPublicSettingService";
import UpdateSettingService from "../SettingServices/UpdateSettingService";
import { GetSettingService } from "../SettingServices/GetSettingService";

const SOURCE_REPO = "zapitu/zapitu-wasession-capture";
const SOURCE_TARBALL = `https://api.github.com/repos/${SOURCE_REPO}/tarball/main`;
const SOURCE_RELEASES = `https://api.github.com/repos/${SOURCE_REPO}/releases/latest`;
const OUTPUT_FILENAME = "capture-extension.zip";

let activeBuild: Promise<void> | null = null;

const PUBLIC_SETTINGS_COMPANY_ID = 1;
const EXTENSION_BUILD_VERSION_KEY = "extensionBuildVersion";
const EXTENSION_BUILD_COUNT_KEY = "extensionBuildCount";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._ -]/g, "").trim() || "extension";
}

async function convertIconToPng(
  sourcePath: string,
  outputPath: string
): Promise<void> {
  const ext = path.extname(sourcePath).toLowerCase();

  if (ext === ".svg") {
    try {
      const svg = fs.readFileSync(sourcePath);
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 128 } });
      const pngData = resvg.render();
      fs.writeFileSync(outputPath, new Uint8Array(pngData.asPng()));
      return;
    } catch (resvgErr) {
      logger.warn(
        { resvgErr },
        "Failed to convert SVG icon with resvg, trying jimp"
      );
    }
  }

  const image = await Jimp.read(sourcePath);
  image.cover({ w: 128, h: 128 });
  const pngBuffer = await image.getBuffer("image/png");
  fs.writeFileSync(outputPath, new Uint8Array(pngBuffer));
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe",
      env: env ?? process.env
    });
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

function downloadJson(url: string): Promise<Record<string, unknown>> {
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
            downloadJson(location).then(resolve, reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`Download failed with status ${response.statusCode}`)
          );
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", chunk => chunks.push(chunk));
        response.on("end", () => {
          try {
            const body = Buffer.concat(
              chunks as unknown as Uint8Array[]
            ).toString("utf-8");
            resolve(JSON.parse(body));
          } catch (parseErr) {
            reject(parseErr);
          }
        });
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

async function resolveLatestTarballUrl(): Promise<string> {
  try {
    const release = await downloadJson(SOURCE_RELEASES);
    const tarballUrl = release.tarball_url as string | undefined;
    if (tarballUrl) {
      return tarballUrl;
    }
  } catch (err) {
    logger.warn(
      { err },
      "Failed to fetch latest release, falling back to main branch"
    );
  }

  return SOURCE_TARBALL;
}

async function getBuildVersion(upstreamVersion: string): Promise<string> {
  const storedVersion = await GetSettingService({
    key: EXTENSION_BUILD_VERSION_KEY,
    user: { profile: "admin", companyId: PUBLIC_SETTINGS_COMPANY_ID }
  });

  const storedCount = await GetSettingService({
    key: EXTENSION_BUILD_COUNT_KEY,
    user: { profile: "admin", companyId: PUBLIC_SETTINGS_COMPANY_ID }
  });

  let count = 0;
  if (storedVersion === upstreamVersion && storedCount) {
    count = parseInt(storedCount, 10) || 0;
  }

  count += 1;

  await UpdateSettingService({
    key: EXTENSION_BUILD_VERSION_KEY,
    value: upstreamVersion,
    companyId: PUBLIC_SETTINGS_COMPANY_ID
  });

  await UpdateSettingService({
    key: EXTENSION_BUILD_COUNT_KEY,
    value: String(count),
    companyId: PUBLIC_SETTINGS_COMPANY_ID
  });

  return `${upstreamVersion}.${count}`;
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
  const defaultIconUrl = `${appHost}/icon-1024x1024.png`;
  let workDir = "";

  try {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "wasession-capture-"));
    const tarball = path.join(workDir, "source.tar.gz");

    const sourceTarball = await resolveLatestTarballUrl();
    await downloadFile(sourceTarball, tarball);
    await runCommand(
      "tar",
      ["-xzf", tarball, "-C", workDir, "--strip-components=1"],
      workDir
    );
    fs.unlinkSync(tarball);

    const packageJsonPath = path.join(workDir, "package.json");
    let upstreamVersion = "0.1.0";
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      upstreamVersion = packageJson.version || "0.1.0";
    }

    const buildVersion = await getBuildVersion(upstreamVersion);
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      packageJson.version = buildVersion;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    const envContent = `EXTENSION_TITLE=${title}\nAPP_HOSTS=${appHost}/*\n`;
    fs.writeFileSync(path.join(workDir, ".env"), envContent);

    const iconsDir = path.join(workDir, "public", "icons");
    fs.mkdirSync(iconsDir, { recursive: true });

    let customIconPath = "";

    if (favicon) {
      const faviconPath = path.join(uploadConfig.directory, favicon);
      if (fs.existsSync(faviconPath)) {
        const ext = path.extname(favicon);
        const sourceIcon = path.join(iconsDir, `source-icon${ext || ".bin"}`);
        fs.copyFileSync(faviconPath, sourceIcon);
        customIconPath = sourceIcon;
      }
    }

    // The upstream package script expects public/icons/logo.jpg as its default
    // icon source. If no custom favicon is provided we still need that file to
    // exist, so fall back to the frontend default icon or one of the shipped
    // PNG icons.
    const defaultIcon = path.join(iconsDir, "logo.jpg");
    if (!fs.existsSync(defaultIcon)) {
      if (!customIconPath) {
        const sourceIcon = path.join(iconsDir, "source-icon.png");
        try {
          await downloadFile(defaultIconUrl, sourceIcon);
          customIconPath = sourceIcon;
        } catch (downloadErr) {
          logger.warn(
            { downloadErr },
            "Failed to download default frontend icon"
          );
        }
      }

      if (!customIconPath) {
        const shippedIcon = path.join(iconsDir, "icon128.png");
        if (fs.existsSync(shippedIcon)) {
          fs.copyFileSync(shippedIcon, defaultIcon);
        }
      }
    }

    await runCommand("npm", ["install"], workDir, {
      ...process.env,
      NODE_ENV: "development"
    });

    // Convert any custom icon (SVG, WebP, etc.) to a PNG that the upstream
    // packaging script can reliably resize with sharp.
    if (customIconPath) {
      const pngIcon = path.join(iconsDir, "logo.png");
      try {
        await convertIconToPng(customIconPath, pngIcon);
        fs.appendFileSync(
          path.join(workDir, ".env"),
          `EXTENSION_ICON=${path.relative(workDir, pngIcon)}\n`
        );
      } catch (convertErr) {
        logger.warn(
          { convertErr },
          "Failed to convert custom icon to PNG, using default icon"
        );
      }
    }

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
