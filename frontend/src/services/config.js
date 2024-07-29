import { loadJSON } from "../helpers/loadJSON";

const config = loadJSON('/config.json');

export function getBackendURL() {
  return (
    config.REACT_APP_BACKEND_URL ||
    (config.BACKEND_PROTOCOL ?? "https") + "://" +
    (config.BACKEND_HOST) + ":" + (config.BACKEND_PORT ?? 443) +
    (config.BACKEND_PATH ?? "")
  );
}

export function getBackendSocketURL() {
  return (
    config.REACT_APP_BACKEND_URL ||
    (config.BACKEND_PROTOCOL ?? "https") + "://" +
    (config.BACKEND_HOST) + ":" + (config.BACKEND_PORT ?? 443)
  );
}

export default config;
