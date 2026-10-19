import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

let sdkLoadPromise = null;
let initializedSdk = null;
let initializedConfig = null;
let activeSignup = null;
const SIGNUP_DATA_TIMEOUT_MS = 10000;
const SIGNUP_TIMEOUT_MS = 5 * 60 * 1000;

const loadFacebookSdk = (appId, graphApiVersion) => {
  const initialize = () => {
    const config = `${appId}:${graphApiVersion}`;
    if (initializedSdk !== window.FB || initializedConfig !== config) {
      window.FB.init({
        appId,
        autoLogAppEvents: false,
        xfbml: false,
        version: graphApiVersion
      });
      initializedSdk = window.FB;
      initializedConfig = config;
    }
  };
  if (window.FB) {
    try {
      initialize();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const fail = () => {
        clearTimeout(timeout);
        sdkLoadPromise = null;
        script.remove();
        reject(new Error("Meta SDK unavailable"));
      };
      const timeout = setTimeout(fail, 20000);
      window.fbAsyncInit = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = fail;
      document.body.appendChild(script);
    });
  }
  return sdkLoadPromise.then(initialize);
};

const releaseSignup = attempt => {
  if (!attempt) return;
  clearTimeout(attempt.timeout);
  clearTimeout(attempt.dataTimeout);
  attempt.abortController.abort();
  attempt.resolveData?.(null);
  attempt.resolveData = null;
  if (activeSignup === attempt) activeSignup = null;
};

const MetaEmbeddedSignupButton = ({
  whatsAppId,
  configId,
  appId,
  graphApiVersion = "v21.0",
  billingMode = "direct",
  signupAvailable = false,
  disabled = false,
  onConnected
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const attemptRef = useRef(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [sdkReady, setSdkReady] = useState(() => !!window.FB);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [sdkAttempt, setSdkAttempt] = useState(0);
  const configured = !!appId && !!configId && signupAvailable === true;

  // Prepare the SDK before clicking so FB.login retains browser user activation.
  useEffect(() => {
    if (!configured) return undefined;
    let active = true;
    setSdkLoading(true);
    loadFacebookSdk(appId, graphApiVersion)
      .then(() => {
        if (active) setSdkReady(true);
      })
      .catch(() => {
        if (active) {
          setSdkReady(false);
          toast.error(i18n.t("connections.meta.loginFailed"));
        }
      })
      .finally(() => {
        if (active) setSdkLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appId, configId, graphApiVersion, sdkAttempt, configured]);
  const finishAttempt = useCallback((attempt, message) => {
    if (attemptRef.current !== attempt) return;
    attemptRef.current = null;
    releaseSignup(attempt);
    setLoading(false);
    setSubmitting(false);
    setPin("");
    if (message) toast.error(i18n.t(message));
  }, []);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
    setPin("");
    const handleMessage = event => {
      const attempt = attemptRef.current;
      if (!attempt || activeSignup !== attempt || attempt.submitting) return;
      if (
        ![
          "https://www.facebook.com",
          "https://web.facebook.com",
          "https://business.facebook.com"
        ].includes(event.origin)
      )
        return;
      let data;
      try {
        data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (data.event === "CANCEL" || data.event === "ERROR") {
        finishAttempt(
          attempt,
          data.event === "CANCEL"
            ? "connections.meta.signupCancelled"
            : "connections.meta.signupFailed"
        );
        return;
      }
      if (data.event !== "FINISH") return;
      const signupData = {
        wabaId: data.data?.waba_id,
        phoneNumberId: data.data?.phone_number_id,
        businessId: data.data?.business_id || data.data?.businessId
      };
      if (!signupData.wabaId || !signupData.phoneNumberId) return;
      attempt.data = signupData;
      attempt.resolveData?.(signupData);
      attempt.resolveData = null;
      clearTimeout(attempt.dataTimeout);
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      const attempt = attemptRef.current;
      attemptRef.current = null;
      releaseSignup(attempt);
    };
  }, [whatsAppId, appId, configId, configured, finishAttempt]);

  const handleClick = () => {
    if (!configured || disabled || !sdkReady || !/^\d{6}$/.test(pin)) return;
    if (activeSignup) {
      toast.error(i18n.t("connections.meta.signupAlreadyOpen"));
      return;
    }
    const attempt = {
      abortController: new AbortController(),
      submitting: false,
      callbackHandled: false
    };
    attemptRef.current = attempt;
    activeSignup = attempt;
    setLoading(true);
    attempt.timeout = setTimeout(
      () => finishAttempt(attempt, "connections.meta.signupTimedOut"),
      SIGNUP_TIMEOUT_MS
    );
    const isCurrent = () =>
      attemptRef.current === attempt && activeSignup === attempt;
    try {
      // Keep FB.login synchronous inside this click: popup blockers require it.
      window.FB.login(
        response => {
          if (!isCurrent() || attempt.callbackHandled) return;
          attempt.callbackHandled = true;
          if (!response?.authResponse?.code) {
            finishAttempt(attempt, "connections.meta.signupCancelled");
            return;
          }
          (async () => {
            const data =
              attempt.data ||
              (await new Promise(resolve => {
                attempt.resolveData = resolve;
                attempt.dataTimeout = setTimeout(
                  () => resolve(null),
                  SIGNUP_DATA_TIMEOUT_MS
                );
              }));
            if (!isCurrent()) return;
            if (!data) {
              finishAttempt(attempt, "connections.meta.missingNumber");
              return;
            }
            attempt.submitting = true;
            setSubmitting(true);
            clearTimeout(attempt.timeout);
            try {
              const responseData = await api.post(
                `/whatsapp/${whatsAppId}/meta/connect`,
                {
                  code: response.authResponse.code,
                  pin,
                  ...data
                },
                { signal: attempt.abortController.signal, timeout: 90000 }
              );
              if (!isCurrent()) return;
              finishAttempt(attempt);
              setPinDialogOpen(false);
              toast.success(i18n.t("connections.toasts.metaConnected"));
              onConnected?.(responseData.data);
            } catch (error) {
              if (!isCurrent()) return;
              finishAttempt(attempt);
              toastError(error);
            }
          })();
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            sessionInfoVersion: "3"
          }
        }
      );
    } catch {
      finishAttempt(attempt, "connections.meta.loginFailed");
    }
  };

  const closePinDialog = () => {
    if (submitting) return;
    if (attemptRef.current) finishAttempt(attemptRef.current);
    setPinDialogOpen(false);
    setPin("");
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        disabled={loading || sdkLoading || !configured || disabled}
        onClick={() => {
          if (!configured || disabled) return;
          if (!sdkReady) {
            setSdkAttempt(attempt => attempt + 1);
          } else {
            setPinDialogOpen(true);
          }
        }}
        startIcon={
          loading || sdkLoading ? <CircularProgress size={16} /> : null
        }
      >
        {i18n.t("connections.buttons.connectMeta")}
      </Button>
      {(!configured || disabled) && (
        <Typography variant="body2" color="textSecondary" role="status">
          {i18n.t("connections.meta.missingConfig")}
        </Typography>
      )}
      <Dialog
        open={pinDialogOpen}
        onClose={closePinDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{i18n.t("connections.meta.signupTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {i18n.t("connections.meta.ownAccount")}
          </Typography>
          {billingMode === "direct" && (
            <Typography variant="body2" gutterBottom>
              {i18n.t("connections.meta.billingSeparate")}
            </Typography>
          )}
          <Typography variant="body2" gutterBottom>
            {i18n.t("connections.meta.cardOnlyMeta")}
          </Typography>
          <TextField
            id={`meta-registration-pin-${whatsAppId}`}
            autoFocus
            fullWidth
            type="password"
            autoComplete="new-password"
            label={i18n.t("connections.meta.pinLabel")}
            helperText={i18n.t("connections.meta.pinHelp")}
            value={pin}
            disabled={loading}
            inputProps={{
              inputMode: "numeric",
              maxLength: 6,
              pattern: "[0-9]{6}"
            }}
            onChange={event =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePinDialog} disabled={submitting}>
            {i18n.t("templateMessageModal.buttons.cancel")}
          </Button>
          <Button
            onClick={handleClick}
            color="primary"
            disabled={
              loading ||
              !configured ||
              disabled ||
              !sdkReady ||
              !/^\d{6}$/.test(pin)
            }
          >
            {i18n.t("connections.meta.continueSignup")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MetaEmbeddedSignupButton;
