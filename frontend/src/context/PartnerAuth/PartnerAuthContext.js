import React, { createContext } from "react";

import usePartnerAuth from "../../hooks/usePartnerAuth";

const PartnerAuthContext = createContext();

const PartnerAuthProvider = ({ children }) => {
  const {
    loading,
    partner,
    isAuth,
    handleLogin,
    handleLogout,
    loginWithToken,
    refreshPartner
  } = usePartnerAuth();

  return (
    <PartnerAuthContext.Provider
      value={{
        loading,
        partner,
        isAuth,
        handleLogin,
        handleLogout,
        loginWithToken,
        refreshPartner
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};

export { PartnerAuthContext, PartnerAuthProvider };
