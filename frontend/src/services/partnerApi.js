import axios from "axios";
import { getBackendURL } from "./config";

// Instância separada da `api` do tenant: o parceiro tem token próprio,
// cookie de refresh próprio (`pjrt`) e nunca deve herdar o Authorization
// de uma sessão de admin aberta no mesmo navegador.
const partnerApi = axios.create({
  baseURL: getBackendURL(),
  withCredentials: true
});

export const PARTNER_TOKEN_KEY = "partnerToken";

export const getPartnerToken = () => {
  const token = localStorage.getItem(PARTNER_TOKEN_KEY);
  if (!token) {
    return null;
  }
  try {
    return JSON.parse(token);
  } catch (error) {
    return token;
  }
};

export const setPartnerToken = token => {
  localStorage.setItem(PARTNER_TOKEN_KEY, JSON.stringify(token));
};

export const clearPartnerToken = () => {
  localStorage.removeItem(PARTNER_TOKEN_KEY);
};

// Guarda de módulo igual à do `hooks/useAuth`: em StrictMode o efeito roda
// duas vezes e sem isso os interceptors seriam registrados em duplicidade.
let partnerInterceptorsRegistered = false;

export const registerPartnerInterceptors = onUnauthorized => {
  if (partnerInterceptorsRegistered) {
    return;
  }
  partnerInterceptorsRegistered = true;

  partnerApi.interceptors.request.use(config => {
    const token = getPartnerToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  partnerApi.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error?.config;

      if (
        error?.response?.status === 403 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const { data } = await partnerApi.post("/partner/auth/refresh_token");
          if (data?.token) {
            setPartnerToken(data.token);
            originalRequest.headers["Authorization"] = `Bearer ${data.token}`;
          }
          return partnerApi(originalRequest);
        } catch (refreshError) {
          clearPartnerToken();
          if (onUnauthorized) {
            onUnauthorized();
          }
          return Promise.reject(refreshError);
        }
      }

      if (error?.response?.status === 401) {
        clearPartnerToken();
        if (onUnauthorized) {
          onUnauthorized();
        }
      }

      return Promise.reject(error);
    }
  );
};

export default partnerApi;
