import axios from "axios";

export const DEFAULT_BACKEND_URL =
  typeof window !== "undefined" && window.location.origin.startsWith("http")
    ? `${window.location.origin}/backend`
    : "http://localhost:8080/backend";

export const isMobileApp = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "capacitor:" ||
    (window.location.hostname === "localhost" && (window.location.port === "" || window.location.port === "80")) ||
    // @ts-ignore
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    // @ts-ignore
    Boolean(window.Capacitor)
  );
};

export const getBackendUrl = (): string => {
  if (typeof window === "undefined") return DEFAULT_BACKEND_URL;

  // Local development
  if (window.location.port === "5173") {
    const saved = localStorage.getItem("backendUrl");
    return saved?.trim() || "http://localhost:8080";
  }

  // Mobile App (Capacitor)
  if (isMobileApp()) {
    const saved = localStorage.getItem("backendUrl");
    if (saved && saved.startsWith("http")) return saved.trim().replace(/\/+$/, "");
    return DEFAULT_BACKEND_URL;
  }

  // Web Browser: seamlessly use current window origin!
  return `${window.location.origin}/backend`;
};

export const setBackendUrl = (url: string) => {
  let cleanUrl = (url || "").trim().replace(/\/+$/, "");
  if (!cleanUrl || !cleanUrl.startsWith("http")) {
    cleanUrl = DEFAULT_BACKEND_URL;
  }
  localStorage.setItem("backendUrl", cleanUrl);
  api.defaults.baseURL = cleanUrl;
};

export const api = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
      } catch {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration: attempt refresh once
    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${getBackendUrl()}/auth/refresh_token`,
          {},
          { withCredentials: true }
        );
        if (data?.token) {
          localStorage.setItem("token", JSON.stringify(data.token));
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("companyId");
        window.location.href = "/";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
