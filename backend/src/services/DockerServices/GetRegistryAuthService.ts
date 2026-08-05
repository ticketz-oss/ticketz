import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { logger } from "../../utils/logger";

export interface RegistryAuthConfig {
  username?: string;
  password?: string;
  auth?: string;
  identitytoken?: string;
  serveraddress?: string;
}

interface DockerConfigFile {
  auths?: Record<string, { auth?: string; identitytoken?: string }>;
  credHelpers?: Record<string, string>;
  credsStore?: string;
}

const DOCKER_HUB_REGISTRY = "index.docker.io";
const DOCKER_HUB_CANONICAL = "https://index.docker.io/v1/";

let cachedConfig: DockerConfigFile | null | undefined;

const getConfigPath = (): string => {
  const dockerConfigDir = (process.env.DOCKER_CONFIG || "").trim();
  if (dockerConfigDir) {
    return path.join(dockerConfigDir, "config.json");
  }
  return path.join(os.homedir(), ".docker", "config.json");
};

const loadDockerConfig = (): DockerConfigFile | null => {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  try {
    const configPath = getConfigPath();
    const raw = fs.readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(raw) as DockerConfigFile;
  } catch {
    cachedConfig = null;
  }

  return cachedConfig;
};

const normalizeRegistryKey = (key: string): string =>
  key
    .replace(/^https?:\/\//, "")
    .replace(/\/v1\/?$/, "")
    .replace(/\/+$/, "");

// Extracts the registry host from an image reference.
// ghcr.io/org/image:tag -> ghcr.io; redis:7-alpine -> docker hub
export const registryFromImageRef = (imageRef: string): string => {
  const firstPart = (imageRef || "").split("/")[0];

  if (
    firstPart.includes(".") ||
    firstPart.includes(":") ||
    firstPart === "localhost"
  ) {
    return firstPart;
  }

  return DOCKER_HUB_REGISTRY;
};

const serverCandidates = (registry: string): string[] => {
  const normalized = normalizeRegistryKey(registry);

  if (
    normalized === DOCKER_HUB_REGISTRY ||
    normalized === "docker.io" ||
    normalized === "registry-1.docker.io"
  ) {
    return [
      DOCKER_HUB_CANONICAL,
      DOCKER_HUB_REGISTRY,
      "docker.io",
      "registry-1.docker.io",
      "https://registry-1.docker.io/v2/"
    ];
  }

  return [
    registry,
    normalized,
    `https://${normalized}`,
    `http://${normalized}`
  ];
};

const decodeInlineAuth = (
  entry: { auth?: string; identitytoken?: string },
  registry: string
): RegistryAuthConfig | null => {
  if (entry.identitytoken) {
    return { identitytoken: entry.identitytoken, serveraddress: registry };
  }

  if (!entry.auth) {
    return null;
  }

  try {
    const decoded = Buffer.from(entry.auth, "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
      auth: entry.auth,
      serveraddress: registry
    };
  } catch {
    return null;
  }
};

// Credential helpers (docker-credential-*) only exist on the host; inside the
// container the call fails and we simply fall back to inline credentials.
const resolveFromHelper = (
  helperSuffix: string,
  candidates: string[],
  registry: string
): RegistryAuthConfig | null => {
  const helperBinary = `docker-credential-${helperSuffix}`;

  // eslint-disable-next-line no-restricted-syntax
  for (const server of candidates) {
    try {
      const output = execFileSync(helperBinary, ["get"], {
        input: server,
        timeout: 5000,
        windowsHide: true,
        stdio: ["pipe", "pipe", "ignore"]
      }).toString();

      const parsed = JSON.parse(output);
      if (!parsed || !parsed.Secret) {
        continue;
      }

      if (parsed.Username === "<token>") {
        return { identitytoken: parsed.Secret, serveraddress: registry };
      }

      return {
        username: parsed.Username,
        password: parsed.Secret,
        serveraddress: registry
      };
    } catch {
      // try next server key
    }
  }

  return null;
};

// Resolves registry credentials for an image reference the same way the
// docker CLI does: ~/.docker/config.json inline "auths", per-registry
// credential helpers and the global credential store.
const GetRegistryAuthService = ({
  imageRef
}: {
  imageRef: string;
}): RegistryAuthConfig | null => {
  const registry = registryFromImageRef(imageRef);
  const config = loadDockerConfig();

  if (!config) {
    return null;
  }

  const candidates = serverCandidates(registry);

  const auths = config.auths || {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(auths)) {
    if (
      !candidates.includes(key) &&
      !candidates.includes(normalizeRegistryKey(key))
    ) {
      continue;
    }

    const auth = decodeInlineAuth(auths[key], registry);
    if (auth) {
      logger.info(`Docker registry auth resolved from config for ${registry}`);
      return auth;
    }
  }

  const helperSuffix =
    (config.credHelpers || {})[registry] ||
    (config.credHelpers || {})[normalizeRegistryKey(registry)] ||
    config.credsStore;

  if (helperSuffix) {
    const auth = resolveFromHelper(helperSuffix, candidates, registry);
    if (auth) {
      logger.info(
        `Docker registry auth resolved via credential helper for ${registry}`
      );
      return auth;
    }
  }

  return null;
};

export default GetRegistryAuthService;
