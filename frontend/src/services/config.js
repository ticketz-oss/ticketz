import { loadJSON } from "../helpers/loadJSON";

// If config.json is not found and the hostname is localhost or 127.0.0 load config-dev.json
let config = loadJSON("/config.json");

if (!config && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  config = loadJSON("/config-dev.json");
  if (!config) {
    config = {
      BACKEND_PROTOCOL: "http",
      BACKEND_HOST: "localhost",
      BACKEND_PORT: "8080",
      LOG_LEVEL: "debug"
    };
  }
}

if (!config) {
  throw new Error("Config not found");
}

export function getBackendURL() {
  if (config.REACT_APP_BACKEND_URL) {
    return config.REACT_APP_BACKEND_URL;
  }
  // BACKEND_HOST vazio => same-origin: usa o proxy /backend do proprio host.
  // Essencial para subdominio por empresa (cada subdominio fala com seu proprio
  // backend via proxy, isolando cookies/branding).
  if (!config.BACKEND_HOST) {
    return config.BACKEND_PATH ?? "/backend";
  }
  const backendHost =
    config.BACKEND_HOST === "localhost" &&
    window.location.hostname.endsWith(".localhost")
      ? window.location.hostname
      : config.BACKEND_HOST;
  return (
    (config.BACKEND_PROTOCOL ?? "https") +
    "://" +
    backendHost +
    ":" +
    (config.BACKEND_PORT ?? 443) +
    (config.BACKEND_PATH ?? "")
  );
}

export function getBackendSocketURL() {
  if (config.REACT_APP_BACKEND_URL) {
    return config.REACT_APP_BACKEND_URL;
  }
  if (!config.BACKEND_HOST) {
    return window.location.origin;
  }
  const backendHost =
    config.BACKEND_HOST === "localhost" &&
    window.location.hostname.endsWith(".localhost")
      ? window.location.hostname
      : config.BACKEND_HOST;
  return (
    (config.BACKEND_PROTOCOL ?? "https") +
    "://" +
    backendHost +
    ":" +
    (config.BACKEND_PORT ?? 443)
  );
}

export default config;
