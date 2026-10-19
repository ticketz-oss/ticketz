import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api, { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import ColorModeContext from "../../layout/themeContext";
import { clearAllCachedSettings } from "../../helpers/settingsCache";
import { getStoredToken, setStoredToken } from "../../helpers/token";
import { loadBranding } from "../../helpers/loadBranding";
import getCompanySlug from "../../helpers/getCompanySlug";
import { signOutGoogle } from "../../services/googleAuth";
import moment from "moment";
import { decodeToken } from "react-jwt";

let apiInterceptorsRegistered = false;

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  const socketManager = useContext(SocketContext);
  const { colorMode } = useContext(ColorModeContext);

  // Reverte para a marca publica da empresa do subdominio atual (ou master).
  const applyPublicBranding = () =>
    loadBranding(colorMode, async key => {
      const slug = getCompanySlug();
      const { data } = await openApi.get(`/public-settings/${key}`, {
        params: slug ? { slug } : undefined
      });
      return data;
    });

  // Identidade visual in-app.
  //
  // O tema deve refletir o TENANT DO SUBDOMINIO, nao a empresa do usuario
  // logado. Assim espacosingular.* sempre tem a cara do Espaco Singular,
  // independente de quem esteja logado. Quando ha subdominio, usa a marca
  // publica daquele slug; sem subdominio (apex / URL raw do Railway) cai na
  // marca da propria empresa do usuario autenticado.
  const applyCompanyBranding = () => {
    if (getCompanySlug()) {
      return applyPublicBranding();
    }
    return loadBranding(colorMode, async key => {
      const { data } = await api.get(`/settings/${key}`);
      return data;
    });
  };

  useEffect(() => {
    if (apiInterceptorsRegistered) {
      return;
    }
    apiInterceptorsRegistered = true;

    api.interceptors.request.use(
      config => {
        const token = getStoredToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
          setIsAuth(true);
        }
        return config;
      },
      error => {
        Promise.reject(error);
      }
    );

    api.interceptors.response.use(
      response => {
        return response;
      },
      async error => {
        const originalRequest = error.config;
        if (
          error?.response?.status === 403 &&
          error?.response?.data?.error === "ERR_SESSION_EXPIRED" &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          const { data } = await api.post("/auth/refresh_token");
          if (data?.token) {
            setStoredToken(data.token);
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
          }
          return api(originalRequest);
        }
        if (error?.response?.status === 401) {
          clearAllCachedSettings();
          localStorage.removeItem("token");
          localStorage.removeItem("companyId");
          api.defaults.headers.Authorization = undefined;
          setIsAuth(false);
        }
        return Promise.reject(error);
      }
    );
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    (async () => {
      if (token) {
        try {
          const { data } = await api.post("/auth/refresh_token");
          if (data?.token) {
            setStoredToken(data.token);
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            socketManager.syncCurrentSocketToken?.(data.token);
            setIsAuth(true);
            setUser(data.user);
            applyCompanyBranding();
          }
        } catch (err) {
          toastError(err);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      return () => {};
    }
    const socket = socketManager.GetSocket(companyId);

    const onCompanyUserUseAuth = data => {
      if (data.action === "update" && data.user.id === user.id) {
        setUser(anterior => ({ ...anterior, ...data.user }));
      }
    };

    socket.on(`company-${companyId}-user`, onCompanyUserUseAuth);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const posLogin = (data, impersonated = false) => {
    const {
      user: { company },
      token
    } = data;

    const { companyId, userId } = decodeToken(token);

    if (has(company, "settings") && isArray(company.settings)) {
      const setting = company.settings.find(s => s.key === "campaignsEnabled");
      if (setting && setting.value === "true") {
        localStorage.setItem("cshow", null); //regra pra exibir campanhas
      }
    }

    moment.locale("pt-br");
    const dueDate = data.user.company.dueDate;
    const vencimento = moment(dueDate).format("DD/MM/yyyy");

    clearAllCachedSettings();

    setStoredToken(token);
    localStorage.setItem("companyId", companyId);
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("companyDueDate", vencimento);
    localStorage.setItem("impersonated", impersonated);
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    setUser(data.user);
    setIsAuth(true);
    applyCompanyBranding();
    toast.success(i18n.t("auth.toasts.success"));
    if (data.user.profile === "admin" && !data.user.hideAdminUI) {
      history.push("/");
    } else {
      history.push("/tickets");
    }
  };

  const handleLogin = async userData => {
    setLoading(true);

    try {
      // Envia o slug do subdominio para escopar o login ao tenant atual.
      const slug = getCompanySlug();
      const { data } = await api.post("/auth/login", {
        ...userData,
        ...(slug ? { slug } : {})
      });
      posLogin(data);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleSocialLogin = async clerkToken => {
    setLoading(true);
    try {
      const slug = getCompanySlug();
      const { data } = await api.post("/auth/social/google", {
        clerkToken,
        ...(slug ? { slug } : {})
      });
      posLogin(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async setupData => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/password/setup", setupData);
      posLogin(data);
      setLoading(false);
      return true;
    } catch (err) {
      toastError(err);
      setLoading(false);
      return false;
    }
  };

  const handleImpersonate = async companyId => {
    setLoading(true);

    try {
      const { data } = await api.get(`/auth/impersonate/${companyId}`);
      posLogin(data, true);
      setLoading(false);
      window.location.reload(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      const impersonatedFlag = localStorage.getItem("impersonated") === "true";
      const token = getStoredToken();
      let impersonatedByToken = false;

      if (token) {
        const decoded = decodeToken(token);
        impersonatedByToken = !!decoded?.impersonated;
      }

      if (impersonatedFlag || impersonatedByToken) {
        const socket = socketManager.GetSocket();
        socket.logout();

        const { data } = await api.post("/auth/impersonate/back");
        localStorage.removeItem("impersonated");
        posLogin(data, false);
        setLoading(false);
        window.location.reload(false);
        return;
      }

      const socket = socketManager.GetSocket();
      socket.logout();

      await api.delete("/auth/logout");
      // Clerk is only an identity bridge; an unavailable provider must not block app logout.
      signOutGoogle().catch(() => {});
      clearAllCachedSettings();
      setIsAuth(false);
      setUser({});
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      localStorage.removeItem("cshow");
      localStorage.removeItem("impersonated");
      api.defaults.headers.Authorization = undefined;
      applyPublicBranding();

      setLoading(false);
      history.push("/login");
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handlePasswordSetup,
    handleSocialLogin,
    handleImpersonate,
    handleLogout
  };
};

export default useAuth;
