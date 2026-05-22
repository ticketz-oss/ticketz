import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const initialSummary = {
  total: 0,
  unviewed: 0,
  disconnected: 0,
  deleted: 0
};

const mergeAlerts = (currentAlerts, nextAlert, limit) => {
  const nextAlerts = [
    nextAlert,
    ...currentAlerts.filter(alert => alert.id !== nextAlert.id)
  ];

  return nextAlerts
    .sort((left, right) => {
      return (
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime()
      );
    })
    .slice(0, limit);
};

const useConnectionAlerts = ({
  companyId,
  limit = 8,
  onlyUnviewed = false
} = {}) => {
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);

  const canAccess = user?.profile === "admin" || user?.super;
  const fallbackCompanyId = localStorage.getItem("companyId");
  const scopedCompanyId = useMemo(() => {
    if (user?.super) {
      return companyId;
    }

    return companyId || fallbackCompanyId || undefined;
  }, [companyId, fallbackCompanyId, user]);

  const requestParams = useMemo(() => {
    return {
      ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
      ...(onlyUnviewed ? { onlyUnviewed: "true" } : {}),
      pageNumber: "1",
      limit: String(limit)
    };
  }, [limit, onlyUnviewed, scopedCompanyId]);

  const fetchAlerts = useCallback(async () => {
    const { data } = await api.get("/connection-alerts", {
      params: requestParams
    });

    setAlerts(data?.alerts || []);
  }, [requestParams]);

  const fetchSummary = useCallback(async () => {
    const { data } = await api.get("/connection-alerts/summary", {
      params: scopedCompanyId ? { companyId: scopedCompanyId } : undefined
    });

    setSummary({
      ...initialSummary,
      ...data
    });
  }, [scopedCompanyId]);

  const refresh = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await Promise.all([fetchAlerts(), fetchSummary()]);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  }, [canAccess, fetchAlerts, fetchSummary]);

  const markAllViewed = useCallback(async () => {
    if (!canAccess) {
      return;
    }

    try {
      await api.put(
        "/connection-alerts/viewed/all",
        scopedCompanyId ? { companyId: scopedCompanyId } : {}
      );
      setAlerts(currentAlerts =>
        currentAlerts.map(alert => ({ ...alert, viewed: true }))
      );
      setSummary(currentSummary => ({
        ...currentSummary,
        unviewed: 0
      }));
    } catch (error) {
      toastError(error);
    }
  }, [canAccess, scopedCompanyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!canAccess) {
      return undefined;
    }

    const currentCompanyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(currentCompanyId);

    const onConnectionAlert = payload => {
      if (payload?.action !== "create" || !payload?.alert) {
        return;
      }

      if (
        scopedCompanyId &&
        Number(payload.alert.companyId) !== Number(scopedCompanyId)
      ) {
        return;
      }

      setAlerts(currentAlerts =>
        mergeAlerts(currentAlerts, payload.alert, limit)
      );
      setSummary(currentSummary => ({
        total: (currentSummary.total || 0) + 1,
        unviewed:
          (currentSummary.unviewed || 0) + (payload.alert.viewed ? 0 : 1),
        disconnected:
          (currentSummary.disconnected || 0) +
          (payload.alert.eventType === "disconnected" ? 1 : 0),
        deleted:
          (currentSummary.deleted || 0) +
          (payload.alert.eventType === "deleted" ? 1 : 0)
      }));
    };

    socket.on("connectionAlert", onConnectionAlert);

    return () => {
      socket.disconnect();
    };
  }, [canAccess, limit, scopedCompanyId, socketManager]);

  return {
    alerts,
    summary,
    loading,
    markAllViewed,
    refresh
  };
};

export default useConnectionAlerts;
