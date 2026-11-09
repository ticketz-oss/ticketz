import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { getBackendUrl } from "../services/api";
import socketService from "../services/socket";

interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  getMediaUrl: (filename?: string) => string;
  updateSettingValue: (key: string, value: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem("chatv2_settings");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const backendUrl = getBackendUrl();

  const applyVisualSettings = useCallback((dict: Record<string, string>) => {
    // 1. Dynamic Primary Theme Color
    if (dict.primaryColorLight) {
      document.documentElement.style.setProperty("--whatsapp-primary", dict.primaryColorLight);
    }

    // 2. Dynamic App Title
    if (dict.appName) {
      document.title = dict.appName;
    }

    // 3. Dynamic Favicon
    if (dict.appLogoFavicon) {
      const faviconUrl = dict.appLogoFavicon.startsWith("http")
        ? dict.appLogoFavicon
        : `${backendUrl.startsWith("http") ? backendUrl : ""}/public/${dict.appLogoFavicon}`;
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [backendUrl]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    try {
      // If logged in, fetch full settings
      const token = localStorage.getItem("token");
      if (token) {
        const { data } = await api.get<any[]>("/settings");
        if (Array.isArray(data)) {
          const dict: Record<string, string> = {};
          data.forEach((s) => {
            if (s.key) dict[s.key] = s.value ?? "";
          });
          setSettings(dict);
          localStorage.setItem("chatv2_settings", JSON.stringify(dict));
          applyVisualSettings(dict);
          return;
        }
      }

      // If not logged in, fetch public settings keys
      const publicKeys = [
        "appName",
        "appLogoLight",
        "appLogoDark",
        "appLogoFavicon",
        "primaryColorLight",
        "loginSidePanelImage",
        "loginBackgroundContent",
      ];

      const results = await Promise.allSettled(
        publicKeys.map((key) => api.get<any>(`/public-settings/${key}`))
      );

      const dict: Record<string, string> = {};
      results.forEach((res, i) => {
        if (res.status === "fulfilled" && res.value?.data) {
          dict[publicKeys[i]] = res.value.data;
        }
      });

      setSettings((prev) => {
        const merged = { ...prev, ...dict };
        localStorage.setItem("chatv2_settings", JSON.stringify(merged));
        applyVisualSettings(merged);
        return merged;
      });
    } catch (err) {
      console.warn("Could not load settings:", err);
    } finally {
      setLoading(false);
    }
  }, [applyVisualSettings]);

  useEffect(() => {
    // Initial load & apply cached
    applyVisualSettings(settings);
    refreshSettings();
  }, [applyVisualSettings, refreshSettings]);

  // Listen to live socket settings changes
  useEffect(() => {
    const socket = socketService.getSocket();
    const companyId = localStorage.getItem("companyId");
    if (!socket || !companyId) return;

    const onSettingsUpdate = (data: { key: string; value: string }) => {
      if (data?.key) {
        setSettings((prev) => {
          const updated = { ...prev, [data.key]: data.value };
          localStorage.setItem("chatv2_settings", JSON.stringify(updated));
          applyVisualSettings(updated);
          return updated;
        });
      }
    };

    socket.on(`company-${companyId}-settings`, onSettingsUpdate);
    socket.on("settings", onSettingsUpdate);

    return () => {
      socket.off(`company-${companyId}-settings`, onSettingsUpdate);
      socket.off("settings", onSettingsUpdate);
    };
  }, [applyVisualSettings]);

  const updateSettingValue = async (key: string, value: string) => {
    await api.put(`/settings/${key}`, { value });
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("chatv2_settings", JSON.stringify(updated));
      applyVisualSettings(updated);
      return updated;
    });
  };

  const getMediaUrl = (filename?: string): string => {
    if (!filename) return "";
    if (filename.startsWith("http")) return filename;
    const base = backendUrl.startsWith("http") ? `${backendUrl}/public` : `/backend/public`;
    return `${base}/${filename}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        getMediaUrl,
        updateSettingValue,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => useContext(SettingsContext);
