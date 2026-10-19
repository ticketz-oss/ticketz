import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { i18n } from "../translate/i18n";
import {
  getGoogleConfiguration,
  loadGoogleClerk,
  startGoogleSignIn,
  handleGoogleCallback,
  requiresOnlyLegalConsent,
  acceptGoogleLegal,
  exchangeGoogleSession,
  requireGoogleIntent,
  clearGoogleIntent,
  googleFlowPaths,
  socialError
} from "../services/googleAuth";

export function googleErrorMessage(error, language) {
  const code = error?.response?.data?.error || error?.code;
  const key =
    {
      ERR_SOCIAL_LOGIN_NO_ACCESS: "noAccess",
      ERR_COMPANY_INACTIVE: "inactive",
      ERR_COMPANY_SUSPENDED: "inactive",
      ERR_SOCIAL_LOGIN_DISABLED: "unavailable",
      ERR_SOCIAL_LOGIN_EXPIRED: "expired"
    }[code] || "failed";
  return i18n.t(`socialLogin.${key}`, language ? { lng: language } : undefined);
}

export default function useGoogleLogin(exchange, flow = "web") {
  const { pathname } = useLocation();
  const paths = googleFlowPaths(flow);
  const callback = pathname.startsWith(`${paths.root}/`);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(callback);
  const [error, setError] = useState("");
  const [legal, setLegal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const client = useRef();
  const exchangeRef = useRef(exchange);
  const running = useRef(false);
  exchangeRef.current = exchange;

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const configuration = await getGoogleConfiguration();
        if (
          flow === "mobile" &&
          !configuration.publishableKey?.startsWith("pk_test_")
        ) {
          throw socialError("ERR_SOCIAL_LOGIN_DISABLED");
        }
        if (callback) requireGoogleIntent(configuration, flow);
        const clerk = await loadGoogleClerk(configuration);
        if (!live) return;
        client.current = clerk;
        setConfig(configuration);
        setReady(true);
        if (!callback) return;
        if (pathname === paths.callback) {
          await handleGoogleCallback(clerk, configuration, flow);
        } else if (pathname === paths.complete) {
          await exchangeGoogleSession(
            clerk,
            configuration,
            token => exchangeRef.current(token),
            flow
          );
        } else if (
          pathname === paths.continue &&
          requiresOnlyLegalConsent(clerk)
        ) {
          setLegal(true);
        } else {
          throw socialError("ERR_SOCIAL_LOGIN_INVALID");
        }
      } catch (err) {
        if (live) {
          setReady(false);
          if (callback || flow === "mobile") {
            clearGoogleIntent(flow);
            setError(
              googleErrorMessage(err, flow === "mobile" ? "pt" : undefined)
            );
          }
        }
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => {
      live = false;
    };
    // The route map is constant for each flow; it never comes from user input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, callback, flow]);

  const start = async () => {
    if (!ready || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await startGoogleSignIn(config, flow);
    } catch (err) {
      setError(googleErrorMessage(err, flow === "mobile" ? "pt" : undefined));
      setBusy(false);
      running.current = false;
    }
  };
  const accept = async event => {
    event.preventDefault();
    if (!accepted || running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await acceptGoogleLegal(client.current, config, accepted, flow);
      await exchangeGoogleSession(
        client.current,
        config,
        token => exchangeRef.current(token),
        flow
      );
    } catch (err) {
      clearGoogleIntent(flow);
      setLegal(false);
      setError(googleErrorMessage(err, flow === "mobile" ? "pt" : undefined));
    } finally {
      setBusy(false);
      running.current = false;
    }
  };
  return {
    callback,
    ready,
    busy,
    error,
    legal,
    accepted,
    setAccepted,
    start,
    accept
  };
}
