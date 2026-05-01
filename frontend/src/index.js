import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import App from "./App";
import { loadJSON } from "./helpers/loadJSON";
import { i18n } from "./translate/i18n";
import axios from "axios";

const BACKEND_RETRY_INTERVAL_SECONDS = 30;
const BACKEND_PROBE_TIMEOUT_MS = 10000;
let backendRetryTimeout = null;

function clearBackendRetryTimers() {
  if (backendRetryTimeout) {
    clearTimeout(backendRetryTimeout);
    backendRetryTimeout = null;
  }
}

function getBackendProbeUrl(config) {
  const protocol = config.BACKEND_PROTOCOL || "https";
  const hostname = config.BACKEND_HOST || window.location.hostname;
  const port = config.BACKEND_PORT ? `:${config.BACKEND_PORT}` : "";
  const path =
    config.BACKEND_PATH ||
    (hostname === "localhost" || hostname !== window.location.hostname
      ? ""
      : "/backend");

  return `${protocol}://${hostname}${port}${path}/`;
}

function getRetryMessage(error) {
  if (error?.response?.data?.error === "ERR_SESSION_SECRET_UNAVAILABLE") {
    return i18n.t("frontendErrors.ERR_BACKEND_NOT_READY");
  }

  return i18n.t("frontendErrors.ERR_BACKEND_UNREACHABLE");
}

function showRetryProgress(message, onRetry) {
  window.renderError(
    `${message}<br><br><div class="progress-bar" style="margin: 8px auto 0 auto;"><div class="progress regress" style="animation-duration: ${BACKEND_RETRY_INTERVAL_SECONDS}s;"></div></div>`,
  );

  clearBackendRetryTimers();

  backendRetryTimeout = setTimeout(() => {
    clearBackendRetryTimers();
    onRetry();
  }, BACKEND_RETRY_INTERVAL_SECONDS * 1000);
}

function renderApp() {
  clearBackendRetryTimers();
  ReactDOM.render(
    // <React.StrictMode>
    <CssBaseline>
      <App />
    </CssBaseline>,
    // </React.StrictMode>
    document.getElementById("root"),
    () => {
      window.finishProgress();
    },
  );
}

function probeBackendAndRender(config, attempt = 1) {
  const backendUrl = `${getBackendProbeUrl(config)}?cb=${Date.now()}`;

  axios
    .get(backendUrl, { timeout: BACKEND_PROBE_TIMEOUT_MS })
    .then((response) => {
      const serverDate = new Date(response.headers["date"]);
      const clientDate = new Date();
      const diff = Math.abs(serverDate - clientDate);
      const diffMinutes = Math.floor(diff / 1000 / 60);

      if (diffMinutes > 5) {
        let message = i18n.t("frontendErrors.ERR_CLOCK_OUT_OF_SYNC");
        message += `<br><br>${i18n.t("common.serverTime")} ${serverDate.toLocaleString()}`;
        message += `<br>${i18n.t("common.clientTime")} ${clientDate.toLocaleString()}`;
        message += `<br>${i18n.t("common.differenceMinutes", { count: diffMinutes })}`;
        window.renderError(message);
        return;
      }

      renderApp();
    })
    .catch((error) => {
      const retryMessage = getRetryMessage(error);
      showRetryProgress(retryMessage, () => {
        probeBackendAndRender(config, attempt + 1);
      });
    });
}

const config = loadJSON("/config.json");

if (!config) {
  window.renderError(i18n.t("frontendErrors.ERR_CONFIG_ERROR"));
} else {
  probeBackendAndRender(config);
}
