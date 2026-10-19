import React, { useContext } from "react";
import { Route as RouterRoute, Redirect } from "react-router-dom";

import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import {
  canSeeScreen,
  screenForPath,
  screenOptions
} from "../helpers/screenAccess";
import { i18n } from "../translate/i18n";

const Route = ({ component: Component, isPrivate = false, ...rest }) => {
  const { isAuth, loading, user } = useContext(AuthContext);

  if (!isAuth && isPrivate) {
    return (
      <>
        {loading && <BackdropLoading />}
        <Redirect to={{ pathname: "/login", state: { from: rest.location } }} />
      </>
    );
  }

  if (isAuth && !isPrivate) {
    return (
      <>
        {loading && <BackdropLoading />}
        <Redirect to={{ pathname: "/", state: { from: rest.location } }} />;
      </>
    );
  }

  const screen = screenForPath(rest.path || rest.location?.pathname || "");
  if (isPrivate && !loading && screen && !canSeeScreen(user, screen)) {
    const firstAllowed = screenOptions.find(option =>
      canSeeScreen(user, option.id)
    );
    return firstAllowed ? (
      <Redirect to={firstAllowed.path} />
    ) : (
      <div style={{ padding: 32 }}>
        {i18n.t("errors.forbidden", { defaultValue: "Acesso não permitido." })}
      </div>
    );
  }

  return (
    <>
      {loading && <BackdropLoading />}
      <RouterRoute {...rest} component={Component} />
    </>
  );
};

export default Route;
