import React, { createContext, useContext, useLayoutEffect } from "react";

import useAuth from "../../hooks/useAuth.js";

import ColorModeContext from "../../layout/themeContext";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const {
    loading,
    user,
    isAuth,
    handleLogin,
    handlePasswordSetup,
    handleSocialLogin,
    handleImpersonate,
    handleLogout
  } = useAuth();

  const {
    colorMode: { setThemeCompany }
  } = useContext(ColorModeContext);
  const companyId = isAuth
    ? (user?.companyId ?? user?.company?.id ?? null)
    : null;
  useLayoutEffect(() => {
    setThemeCompany(companyId);
  }, [companyId, setThemeCompany]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        isAuth,
        handleLogin,
        handlePasswordSetup,
        handleSocialLogin,
        handleImpersonate,
        handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
