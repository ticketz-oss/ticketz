import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import moment from "moment";
import { decodeToken } from "react-jwt";

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  const socketManager = useContext(SocketContext);

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
        setIsAuth(true);
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { data } = await api.post("/auth/refresh_token");
        if (data) {
          localStorage.setItem("token", JSON.stringify(data.token));
          api.defaults.headers.Authorization = `Bearer ${data.token}`;
        }
        return api(originalRequest);
      }
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("companyId");
        api.defaults.headers.Authorization = undefined;
        setIsAuth(false);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        try {
          const { data } = await api.post("/auth/refresh_token");
          api.defaults.headers.Authorization = `Bearer ${data.token}`;
          setIsAuth(true);
          setUser(data.user);
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

    const onCompanyUserUseAuth = (data) => {
      if (data.action === "update" && data.user.id === user.id) {
        setUser(data.user);
      }
    }

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
      const setting = company.settings.find(
        (s) => s.key === "campaignsEnabled"
      );
      if (setting && setting.value === "true") {
        localStorage.setItem("cshow", null); //regra pra exibir campanhas
      }
    }

    moment.locale('pt-br');
    const dueDate = data.user.company.dueDate;
    const hoje = moment(moment()).format("DD/MM/yyyy");
    const vencimento = moment(dueDate).format("DD/MM/yyyy");

    var diff = moment(dueDate).diff(moment(moment()).format());

    var dias = moment.duration(diff).asDays();

    localStorage.setItem("token", JSON.stringify(token));
    localStorage.setItem("companyId", companyId);
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("companyDueDate", vencimento);
    localStorage.setItem("impersonated", impersonated);
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    setUser(data.user);
    setIsAuth(true);
    if (dias < 0) {
      toast.warn(`Sua assinatura venceu há ${Math.round(dias) * -1} ${Math.round(dias) * -1 === 1 ? 'dia' : 'dias'} `);
    } else if (Math.round(dias) < 5) {
      toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'} `);
    } else {
      toast.success(i18n.t("auth.toasts.success"));
    }
    if (data.user.profile === "admin" && !data.user.hideAdminUI) {
      history.push("/");
    } else {
      history.push("/tickets");
    }
  }

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      posLogin(data);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleImpersonate = async (companyId) => {
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
      const socket = socketManager.GetSocket();
      socket.logout();

      await api.delete("/auth/logout");
      setIsAuth(false);
      setUser({});
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      localStorage.removeItem("cshow");
      api.defaults.headers.Authorization = undefined;

      setLoading(false);
      history.push("/login");
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (_) {
      return null;
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleImpersonate,
    handleLogout,
    getCurrentUserInfo,
  };
};

export default useAuth;
