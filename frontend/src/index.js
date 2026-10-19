import React from "react";
import ReactDOM from "react-dom";
import { loadJSON } from "./helpers/loadJSON";
import { i18n } from "./translate/i18n";
import getCompanySlug from "./helpers/getCompanySlug";
import { isDocumentationPath } from "./pages/Documentation/examples";

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
  const explicitBackendHost = config.BACKEND_HOST;
  const hostname =
    explicitBackendHost === "localhost" &&
    window.location.hostname.endsWith(".localhost")
      ? window.location.hostname
      : explicitBackendHost || window.location.hostname;
  // BACKEND_PORT refers to the internal container endpoint. Same-origin
  // browser requests go through /backend on the current HTTPS origin.
  const port =
    explicitBackendHost && config.BACKEND_PORT ? `:${config.BACKEND_PORT}` : "";
  const path =
    config.BACKEND_PATH ||
    (explicitBackendHost || hostname === "localhost" ? "" : "/backend");

  const backendOrigin = explicitBackendHost
    ? `${protocol}://${hostname}${port}`
    : window.location.origin;

  return `${backendOrigin}${path}/`;
}

function getRetryMessage(error) {
  if (error?.response?.data?.error === "ERR_SESSION_SECRET_UNAVAILABLE") {
    return i18n.t("frontendErrors.ERR_BACKEND_NOT_READY");
  }

  return i18n.t("frontendErrors.ERR_BACKEND_UNREACHABLE");
}

function showRetryProgress(message, onRetry) {
  window.renderError(
    `${message}<br><br><div class="progress-bar" style="margin: 8px auto 0 auto;"><div class="progress regress" style="animation-duration: ${BACKEND_RETRY_INTERVAL_SECONDS}s;"></div></div>`
  );

  clearBackendRetryTimers();

  backendRetryTimeout = setTimeout(() => {
    clearBackendRetryTimers();
    onRetry();
  }, BACKEND_RETRY_INTERVAL_SECONDS * 1000);
}

async function renderApp() {
  clearBackendRetryTimers();
  const [{ default: CssBaseline }, { default: App }] = await Promise.all([
    import("@material-ui/core/CssBaseline"),
    import("./App")
  ]);

  ReactDOM.render(
    // <React.StrictMode>
    <CssBaseline>
      <App />
    </CssBaseline>,
    // </React.StrictMode>
    document.getElementById("root"),
    () => {
      window.finishProgress();
    }
  );
}

async function renderPublicLanding() {
  document.getElementById("splash-background")?.remove();
  document.documentElement.style.backgroundColor = "#f2f5fb";
  const { default: LandingPage } = await import("./pages/LandingPage");
  ReactDOM.render(<LandingPage />, document.getElementById("root"), () => {
    window.finishProgress();
  });
}

async function renderPublicCheckout() {
  document.getElementById("splash-background")?.remove();
  document.documentElement.style.backgroundColor = "#f2f5fb";
  const { default: Checkout } = await import("./pages/Checkout");
  ReactDOM.render(<Checkout />, document.getElementById("root"), () => {
    window.finishProgress();
  });
}

async function probeBackendAndRender(config, attempt = 1) {
  const { default: axios } = await import("axios");
  const backendUrl = `${getBackendProbeUrl(config)}?cb=${Date.now()}`;

  axios
    .get(backendUrl, { timeout: BACKEND_PROBE_TIMEOUT_MS })
    .then(() => {
      renderApp();
    })
    .catch(error => {
      const retryMessage = getRetryMessage(error);
      showRetryProgress(retryMessage, () => {
        probeBackendAndRender(config, attempt + 1);
      });
    });
}

const config = loadJSON("/config.json");
const isBrandingPreview = window.location.pathname === "/preview/branding";
const isPublicLanding = window.location.pathname === "/" && !getCompanySlug();
const isPublicCheckout =
  /^\/(assinar|signup)\/?$/.test(window.location.pathname) &&
  !getCompanySlug() &&
  !new URLSearchParams(window.location.search).has("companyId");

if (isDocumentationPath(window.location.pathname)) {
  document.getElementById("splash-background")?.remove();
  import("./pages/Documentation").then(({ default: Documentation }) => {
    ReactDOM.render(<Documentation />, document.getElementById("root"), () =>
      window.finishProgress()
    );
  });
} else if (!config) {
  window.renderError(i18n.t("frontendErrors.ERR_CONFIG_ERROR"));
} else if (isPublicLanding) {
  renderPublicLanding();
} else if (isBrandingPreview) {
  document.getElementById("splash-background")?.remove();
  import("./pages/BrandingPreview").then(({ default: Preview }) => {
    ReactDOM.render(<Preview />, document.getElementById("root"), () =>
      window.finishProgress()
    );
  });
} else if (isPublicCheckout) {
  renderPublicCheckout();
} else {
  probeBackendAndRender(config);
}
