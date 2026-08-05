import fs from "fs";
import os from "os";
import path from "path";
import Docker from "dockerode";
import { logger } from "../../utils/logger";

let client: Docker | null = null;

const unique = (values: string[]): string[] =>
  values.filter((value, index) => value && values.indexOf(value) === index);

// Standard Docker socket locations across platforms, so the backend can
// manage containers even when running outside the compose stack
const candidateSockets = (): string[] => {
  const candidates: string[] = [];

  if (process.platform === "win32") {
    // Docker Desktop / Docker Engine on Windows
    candidates.push("//./pipe/docker_engine");
    candidates.push("//./pipe/dockerDesktopLinuxEngine");
    return candidates;
  }

  // Native Linux (dockerd default) and rootless setups
  candidates.push("/var/run/docker.sock");
  try {
    candidates.push(`/run/user/${process.getuid()}/docker.sock`);
  } catch {
    // getuid may be unavailable; ignore
  }
  candidates.push(`${os.homedir()}/.docker/run/docker.sock`);

  if (process.env.XDG_RUNTIME_DIR) {
    candidates.push(`${process.env.XDG_RUNTIME_DIR}/docker.sock`);
  }

  // Docker Desktop for Mac (colima/lima style paths are symlinked too)
  candidates.push("/var/run/docker.raw.sock");

  return unique(candidates);
};

const firstExistingSocket = (): string | null => {
  const socket = candidateSockets().find(candidate => fs.existsSync(candidate));
  return socket || null;
};

const GetDockerClient = (): Docker => {
  if (client) {
    return client;
  }

  const dockerHost = (process.env.DOCKER_HOST || "").trim();

  if (dockerHost.startsWith("unix://") || dockerHost.startsWith("npipe://")) {
    client = new Docker({
      socketPath: dockerHost.replace(/^(unix|npipe):\/\//, "")
    });
  } else if (dockerHost.startsWith("tcp://") || dockerHost.startsWith("http")) {
    client = new Docker({ host: dockerHost });
  } else if (dockerHost.startsWith("ssh://")) {
    client = new Docker({ host: dockerHost });
  } else if (dockerHost) {
    // plain socket path or host:port
    client =
      dockerHost.includes(path.sep) || dockerHost.startsWith("//")
        ? new Docker({ socketPath: dockerHost })
        : new Docker({ host: dockerHost });
  } else {
    const socketPath = firstExistingSocket();

    if (socketPath) {
      logger.info(`Docker client using detected socket: ${socketPath}`);
      client = new Docker({ socketPath });
    } else {
      // last resort: dockerode defaults (/var/run/docker.sock or npipe)
      client = new Docker();
    }
  }

  return client;
};

export default GetDockerClient;
