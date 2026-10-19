import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@material-ui/core";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import MetaEmbeddedSignupButton from "../MetaEmbeddedSignupButton";

// Payment details stay on Meta. Never render an arbitrary destination from a
// response as the place where the customer should enter billing information.
const officialBillingUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "business.facebook.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

export default function MetaOnboardingStatus({
  whatsapp,
  config,
  companyId,
  onRefreshConfig
}) {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setFailed(false);
    setOnboarding(null);
    api
      .get(`/whatsapp/${whatsapp.id}/meta/onboarding`, {
        signal: controller.signal,
        timeout: 15000
      })
      .then(({ data }) => {
        if (active) setOnboarding(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [whatsapp.id, whatsapp.status, companyId, refresh]);

  const connected =
    (onboarding?.connectionStatus ?? whatsapp.status) === "CONNECTED";
  const billingUrl = officialBillingUrl(onboarding?.billingManagementUrl);

  return (
    <Box maxWidth={400} textAlign="left">
      <Typography variant="body2" gutterBottom>
        {i18n.t("connections.meta.billingSeparate")}
      </Typography>
      {loading && (
        <Typography variant="body2" role="status">
          {i18n.t("connections.meta.loadingStatus")}
        </Typography>
      )}
      {failed && (
        <Typography variant="body2" color="error" role="alert">
          {i18n.t("connections.meta.statusFailed")}
        </Typography>
      )}
      {!connected && (
        <MetaEmbeddedSignupButton
          key={`${companyId}-${whatsapp.id}`}
          whatsAppId={whatsapp.id}
          appId={config.appId}
          configId={config.configId}
          graphApiVersion={config.graphApiVersion}
          billingMode={config.billingMode}
          signupAvailable={config.signupAvailable}
          disabled={loading || failed || config.loading || config.failed}
          onConnected={() => setRefresh(value => value + 1)}
        />
      )}
      {connected && (
        <Typography variant="body2" gutterBottom>
          {i18n.t("connections.meta.accountConnected")}
        </Typography>
      )}
      {onboarding?.wabaId && (
        <>
          <Typography variant="body2">
            {i18n.t("connections.meta.wabaLabel", { id: onboarding.wabaId })}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {i18n.t("connections.meta.billingUnverified")}
          </Typography>
          {billingUrl && (
            <Button
              component="a"
              href={billingUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              variant="outlined"
              size="small"
            >
              {i18n.t("connections.meta.openBilling")}
            </Button>
          )}
          <Typography variant="caption" display="block">
            {i18n.t("connections.meta.billingChooseAccount")}
          </Typography>
        </>
      )}
      {!loading && (
        <Button
          size="small"
          onClick={() => {
            onRefreshConfig?.();
            setRefresh(value => value + 1);
          }}
        >
          {i18n.t("connections.meta.refreshStatus")}
        </Button>
      )}
    </Box>
  );
}
