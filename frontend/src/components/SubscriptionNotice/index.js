import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconButton, makeStyles } from "@material-ui/core";
import { AlertCircle, X } from "lucide-react";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    marginBottom: 12,
    borderRadius: 18,
    border: "1px solid",
    flexShrink: 0,
    fontSize: 14,
    lineHeight: 1.5,
    "& > svg": { flexShrink: 0 },
    "& a": { color: "inherit", fontWeight: 600, whiteSpace: "nowrap" },
    [theme.breakpoints.down("sm")]: {
      '.estrutura-app[data-navegacao="fechada"] &': { marginLeft: 52 }
    },
    [theme.breakpoints.down("xs")]: { padding: "10px 12px", gap: 8 }
  },
  warning: {
    backgroundColor: theme.mode === "dark" ? "#302711" : "#fff5d6",
    borderColor: theme.mode === "dark" ? "#66521e" : "#ead18a",
    color: theme.mode === "dark" ? "#ffe19a" : "#72520a"
  },
  error: {
    backgroundColor: theme.mode === "dark" ? "#32191c" : "#fce9e9",
    borderColor: theme.mode === "dark" ? "#703338" : "#edb9bd",
    color: theme.mode === "dark" ? "#ffb4ba" : "#a52331"
  },
  text: { flex: 1, minWidth: 0 },
  close: { color: "inherit", flexShrink: 0 }
}));

export default function SubscriptionNotice() {
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const classes = useStyles();
  const [data, setData] = useState(null);
  const [dismissedDay, setDismissedDay] = useState(null);
  const isAdmin = user?.profile === "admin";
  const storageKey = `subscription-notice:${user?.companyId}:${user?.id}`;

  useEffect(() => {
    setData(null);
    try {
      setDismissedDay(localStorage.getItem(storageKey));
    } catch (_) {
      setDismissedDay(null);
    }
    if (!isAdmin) return;
    let active = true;
    let fetching = false;
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const response = await api.get("/invoices/subscription-notice");
        if (active) setData(response.data);
      } catch (_) {
        // Retry on the next interval or focus without interrupting work.
      } finally {
        fetching = false;
      }
    };
    const syncDismissal = event => {
      if (event.key === storageKey) setDismissedDay(event.newValue);
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", syncDismissal);
    const socket = socketManager?.GetSocket(user.companyId);
    const paymentEvent = `company-${user.companyId}-payment`;
    socket?.on(paymentEvent, refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", syncDismissal);
      socket?.off(paymentEvent, refresh);
      socket?.disconnect();
    };
  }, [isAdmin, storageKey, socketManager, user?.companyId]);

  const notice = data?.notice;
  if (!isAdmin || !notice || dismissedDay === data.billingDay) return null;
  const message = notice.blocked
    ? "subscriptionNotice.expired"
    : notice.severity === "warning"
      ? "subscriptionNotice.dueToday"
      : notice.remainingDays === 1
        ? "subscriptionNotice.lastDay"
        : "subscriptionNotice.overdue";
  const dismiss = () => {
    setDismissedDay(data.billingDay);
    try {
      localStorage.setItem(storageKey, data.billingDay);
    } catch (_) {}
  };

  return (
    <section
      role="status"
      aria-live="polite"
      className={`${classes.card} ${classes[notice.severity]}`}
      data-testid="subscription-notice"
    >
      <AlertCircle size={20} aria-hidden="true" />
      <div className={classes.text}>
        {i18n.t(message, { count: notice.remainingDays })}{" "}
        <Link to="/financeiro">
          {i18n.t("subscriptionNotice.viewInvoices")}
        </Link>
      </div>
      <IconButton
        size="small"
        className={classes.close}
        aria-label={i18n.t("subscriptionNotice.dismiss")}
        onClick={dismiss}
      >
        <X size={18} />
      </IconButton>
    </section>
  );
}
