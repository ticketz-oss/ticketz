import React, { useContext } from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import BackdropLoading from "../components/BackdropLoading";
import {
  PartnerAuthContext,
  PartnerAuthProvider
} from "../context/PartnerAuth/PartnerAuthContext";
import PartnerLayout from "../layout/PartnerLayout";
import PartnerAjuda from "../pages/Partner/Ajuda";
import PartnerClientes from "../pages/Partner/Clientes";
import PartnerConfiguracoes from "../pages/Partner/Configuracoes";
import PartnerFinanceiro from "../pages/Partner/Financeiro";
import PartnerInvite from "../pages/Partner/Invite";
import PartnerLogin from "../pages/Partner/Login";

const PrivatePartnerRoutes = () => {
  const { isAuth, loading } = useContext(PartnerAuthContext);

  if (loading) {
    return <BackdropLoading />;
  }

  if (!isAuth) {
    return <Redirect to="/parceiros/login" />;
  }

  return (
    <PartnerLayout>
      <Switch>
        <Route exact path="/parceiros/clientes" component={PartnerClientes} />
        <Route
          exact
          path="/parceiros/financeiro"
          component={PartnerFinanceiro}
        />
        <Route exact path="/parceiros/ajuda" component={PartnerAjuda} />
        <Route
          exact
          path="/parceiros/ajuda/:groupId"
          component={PartnerAjuda}
        />
        <Route
          exact
          path="/parceiros/ajuda/:groupId/:contentId"
          component={PartnerAjuda}
        />
        <Route
          exact
          path="/parceiros/configuracoes"
          component={PartnerConfiguracoes}
        />
        <Redirect to="/parceiros/clientes" />
      </Switch>
    </PartnerLayout>
  );
};

// Usa o Route nativo do react-router, e nao o wrapper `routes/Route.js`:
// aquele redireciona quem ja esta logado no tenant e quebraria o convite.
const PartnerRoutes = () => (
  <PartnerAuthProvider>
    <Switch>
      <Route exact path="/parceiros/login" component={PartnerLogin} />
      <Route exact path="/parceiros/convite/:token" component={PartnerInvite} />
      <Route path="/parceiros" component={PrivatePartnerRoutes} />
    </Switch>
  </PartnerAuthProvider>
);

export default PartnerRoutes;
