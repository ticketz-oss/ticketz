import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import partnerApi, {
  clearPartnerToken,
  getPartnerToken,
  registerPartnerInterceptors,
  setPartnerToken
} from "../../services/partnerApi";
import toastError from "../../errors/toastError";

const usePartnerAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    registerPartnerInterceptors(() => {
      setIsAuth(false);
      setPartner(null);
    });
  }, []);

  const refreshPartner = useCallback(async () => {
    const { data } = await partnerApi.get("/partner/auth/me");
    setPartner(data);
    return data;
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getPartnerToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshPartner();
        setIsAuth(true);
      } catch (error) {
        // Token expirado no storage: o refresh pelo cookie `pjrt` é a
        // última chance antes de mandar o parceiro para o login.
        try {
          const { data } = await partnerApi.post("/partner/auth/refresh_token");
          setPartnerToken(data.token);
          await refreshPartner();
          setIsAuth(true);
        } catch (refreshError) {
          clearPartnerToken();
          setIsAuth(false);
        }
      }

      setLoading(false);
    };

    bootstrap();
  }, [refreshPartner]);

  const handleLogin = async credentials => {
    setLoading(true);
    try {
      const { data } = await partnerApi.post(
        "/partner/auth/login",
        credentials
      );
      setPartnerToken(data.token);
      setPartner(data.partner);
      setIsAuth(true);
      history.push("/parceiros/clientes");
    } catch (error) {
      toastError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await partnerApi.delete("/partner/auth/logout");
    } catch (error) {
      // Sessão já inválida no servidor: seguir com a limpeza local.
    }
    clearPartnerToken();
    setPartner(null);
    setIsAuth(false);
    setLoading(false);
    history.push("/parceiros/login");
  };

  const loginWithToken = (token, partnerData) => {
    setPartnerToken(token);
    setPartner(partnerData);
    setIsAuth(true);
    toast.success("Senha definida com sucesso!");
    history.push("/parceiros/clientes");
  };

  return {
    isAuth,
    loading,
    partner,
    handleLogin,
    handleLogout,
    loginWithToken,
    refreshPartner
  };
};

export default usePartnerAuth;
