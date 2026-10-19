import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route as RouterRoute, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import MobileLogin from "../pages/MobileLogin";
import Connections from "../pages/Connections/";
import SettingsCustom from "../pages/SettingsCustom/";
import Financeiro from "../pages/Financeiro/";
import CentralCobranca from "../pages/CentralCobranca/";
import Prospeccao from "../pages/Prospeccao/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import Queues from "../pages/Queues/";
import Tags from "../pages/Tags/";
import ChatGPT from "../pages/ChatGPT/";
import Helps from "../pages/Helps/";
import ContactLists from "../pages/ContactLists/";
import ContactListItems from "../pages/ContactListItems/";
// import Companies from "../pages/Companies/";
import QuickMessages from "../pages/QuickMessages/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
import PartnerRoutes from "./PartnerRoutes";
import Schedules from "../pages/Schedules";
import Campaigns from "../pages/Campaigns";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Annoucements from "../pages/Annoucements";
import Chat from "../pages/Chat";
import ToDoList from "../pages/ToDoList/";
import Subscription from "../pages/Subscription/";
import PlatformAccess from "../pages/PlatformAccess";
import PlatformActivation from "../pages/PlatformActivation";

const Fluxos = lazy(() => import("../pages/Fluxos"));

const Routes = () => {
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => {
    const cshow = localStorage.getItem("cshow");
    if (cshow !== undefined) {
      setShowCampaigns(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketsContextProvider>
          <Switch>
            <RouterRoute path="/login/mobile" component={MobileLogin} />
            <RouterRoute path="/login/google/:stage" component={Login} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <RouterRoute exact path="/sso/:token" component={PlatformAccess} />
            <RouterRoute
              exact
              path="/ativar/:token"
              component={PlatformActivation}
            />
            {/* <Route exact path="/create-company" component={Companies} /> */}
            {/* Portal de parceiros: sessao propria, fora do AuthProvider do
                tenant. Route nativo porque o wrapper local redireciona quem ja
                esta logado e quebraria a tela de convite. */}
            <RouterRoute path="/parceiros" component={PartnerRoutes} />
            <WhatsAppsProvider>
              <LoggedInLayout>
                <Route exact path="/" component={Dashboard} isPrivate />
                <Route
                  exact
                  path="/tickets/:ticketId?"
                  component={TicketResponsiveContainer}
                  isPrivate
                />
                <Route
                  exact
                  path="/connections"
                  component={Connections}
                  isPrivate
                />
                <Route
                  exact
                  path="/quick-messages"
                  component={QuickMessages}
                  isPrivate
                />
                <Route
                  exact
                  path="/schedules"
                  component={Schedules}
                  isPrivate
                />
                <Route exact path="/todolist" component={ToDoList} isPrivate />
                <Route exact path="/tags" component={Tags} isPrivate />
                <Route exact path="/contacts" component={Contacts} isPrivate />
                <Route exact path="/helps" component={Helps} isPrivate />
                <Route
                  exact
                  path="/helps/:groupId"
                  component={Helps}
                  isPrivate
                />
                <Route
                  exact
                  path="/helps/:groupId/:contentId"
                  component={Helps}
                  isPrivate
                />
                <Route exact path="/users" component={Users} isPrivate />
                <Route exact path="/chatgpt" component={ChatGPT} isPrivate />
                <Route
                  exact
                  path="/settings"
                  component={SettingsCustom}
                  isPrivate
                />
                <Route
                  exact
                  path="/financeiro"
                  component={Financeiro}
                  isPrivate
                />
                <Route
                  exact
                  path="/cobranca"
                  component={CentralCobranca}
                  isPrivate
                />
                <Route
                  exact
                  path="/prospeccao"
                  component={Prospeccao}
                  isPrivate
                />
                <Route exact path="/queues" component={Queues} isPrivate />
                <Suspense fallback={null}>
                  <Route
                    exact
                    path="/fluxos/:queueId?"
                    component={Fluxos}
                    isPrivate
                  />
                </Suspense>
                <Route
                  exact
                  path="/announcements"
                  component={Annoucements}
                  isPrivate
                />
                <Route
                  exact
                  path="/subscription"
                  component={Subscription}
                  isPrivate
                />

                <Route exact path="/chats/:id?" component={Chat} isPrivate />
                {showCampaigns && (
                  <>
                    <Route
                      exact
                      path="/contact-lists"
                      component={ContactLists}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/contact-lists/:contactListId/contacts"
                      component={ContactListItems}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns"
                      component={Campaigns}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaign/:campaignId/report"
                      component={CampaignReport}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns-config"
                      component={CampaignsConfig}
                      isPrivate
                    />
                  </>
                )}
              </LoggedInLayout>
            </WhatsAppsProvider>
          </Switch>
          <ToastContainer autoClose={3000} />
        </TicketsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
