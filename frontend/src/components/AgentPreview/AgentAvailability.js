import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import AgentPreview from ".";

const AgentAvailability = ({ companyId, ...previewProps }) => {
  const [availability, setAvailability] = useState({
    companyId: null,
    enabled: false
  });
  const requestRef = useRef(0);

  useEffect(() => {
    setAvailability({ companyId, enabled: false });
    if (!companyId) return undefined;

    let active = true;
    const checkAvailability = async () => {
      const requestId = ++requestRef.current;
      try {
        const { data } = await api.get("/agent/availability");
        if (active && requestId === requestRef.current)
          setAvailability({ companyId, enabled: data?.enabled === true });
      } catch (_) {
        if (active && requestId === requestRef.current)
          setAvailability({ companyId, enabled: false });
      }
    };

    checkAvailability();
    window.addEventListener("focus", checkAvailability);
    window.addEventListener("agent-availability-changed", checkAvailability);
    return () => {
      active = false;
      window.removeEventListener("focus", checkAvailability);
      window.removeEventListener(
        "agent-availability-changed",
        checkAvailability
      );
    };
  }, [companyId]);

  return availability.companyId === companyId && availability.enabled ? (
    <AgentPreview {...previewProps} />
  ) : null;
};

export default AgentAvailability;
