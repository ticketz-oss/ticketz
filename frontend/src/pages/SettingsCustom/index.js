import React, { useState, useEffect, useContext, useRef } from "react";
import CentralConfiguracoes from "../../components/Settings/CentralConfiguracoes";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import CabecalhoPagina from "../../components/CabecalhoPagina";
import { makeStyles, Paper, Button, Grid } from "@material-ui/core";

import TabPanel from "../../components/TabPanel";

import SchedulesForm from "../../components/SchedulesForm";
import CompaniesManager from "../../components/CompaniesManager";
import PlansManager from "../../components/PlansManager";
import HelpsManager from "../../components/HelpsManager";
import PartnersManager from "../../components/PartnersManager";
import Options from "../../components/Settings/Options";
import Whitelabel from "../../components/Settings/Whitelabel";
import PaymentGateway from "../../components/Settings/PaymentGateway";
import I18nSettings from "../../components/Settings/I18nSettings";
import AgentContextManager from "../../components/Settings/AgentContextManager";
import WhatsappStatusTenants from "../../components/Settings/WhatsappStatusTenants";
import VoiceSettings from "../../components/VoiceSettings";
import api from "../../services/api";
import { canSeeScreen } from "../../helpers/screenAccess";

import { i18n } from "../../translate/i18n.js";
import { toast } from "react-toastify";

import useCompanies from "../../hooks/useCompanies";
import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";

import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import OpenHoursEditor from "../../components/OpenHoursEditor";

// Helper to check if value is OpenHours format or empty
const isOpenHoursFormat = schedules => {
  if (!schedules || Object.keys(schedules).length === 0) return true;
  return (
    typeof schedules === "object" &&
    Array.isArray(schedules.weeklyRules) &&
    Array.isArray(schedules.overrides)
  );
};

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.palette.background.paper
  },
  mainPaper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    flex: 1
  },
  tab: {
    padding: "8px 12px",
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  paper: {
    ...theme.scrollbarStyles,
    overflowY: "scroll",
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    width: "100%"
  },
  container: {
    width: "100%",
    maxHeight: "100%"
  },
  control: {
    padding: theme.spacing(1)
  },
  textfield: {
    width: "100%"
  }
}));

const SettingsCustom = () => {
  const classes = useStyles();
  const [schedules, setSchedules] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(false);
  const { user: currentUser = {} } = useContext(AuthContext);
  const [settings, setSettings] = useState([]);
  const [settingsStatus, setSettingsStatus] = useState("loading");
  const mounted = useRef(true);
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  const { find, updateSchedules } = useCompanies();
  const { getAll: getAllSettings } = useSettings();

  useEffect(() => {
    let active = true;
    mounted.current = true;
    async function findData() {
      setLoading(true);
      const [companyResult, settingsResult] = await Promise.allSettled([
        find(currentUser.companyId || localStorage.getItem("companyId")),
        getAllSettings()
      ]);
      if (!active) return;
      if (companyResult.status === "fulfilled") {
        setCompany(companyResult.value);
        setSchedules(companyResult.value.schedules);
      }
      if (
        settingsResult.status === "fulfilled" &&
        Array.isArray(settingsResult.value)
      ) {
        const list = settingsResult.value;
        setSettings(list);
        setSettingsStatus("ready");
        setSchedulesEnabled(
          list.some(
            item => item.key === "scheduleType" && item.value === "company"
          )
        );
      } else {
        setSettingsStatus("error");
        toast.error(i18n.t("loginExperience.settingsLoadError"));
      }
      setLoading(false);
    }
    findData();
    return () => {
      active = false;
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/voice/connections")
      .then(() => {
        if (active) setVoiceAvailable(true);
      })
      .catch(() => {
        if (active) setVoiceAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const atualizarConfiguracoes = async () => {
    try {
      const lista = await getAllSettings();
      if (!mounted.current) return;
      if (Array.isArray(lista)) {
        setSettings(lista);
        setSettingsStatus("ready");
        setSchedulesEnabled(
          lista.some(
            item => item.key === "scheduleType" && item.value === "company"
          )
        );
      }
    } catch (erro) {
      if (mounted.current) toast.error(erro);
    }
  };

  const retrySettings = async () => {
    setSettingsStatus("loading");
    try {
      const list = await getAllSettings();
      if (!mounted.current) return;
      if (!Array.isArray(list)) throw new Error("Invalid settings response");
      setSettings(list);
      setSchedulesEnabled(
        list.some(
          item => item.key === "scheduleType" && item.value === "company"
        )
      );
      setSettingsStatus("ready");
    } catch (_) {
      if (mounted.current) setSettingsStatus("error");
    }
  };

  const handleSettingSaved = (key, value) => {
    if (!mounted.current) return;
    setSettings(current => {
      const found = current.some(setting => setting.key === key);
      return found
        ? current.map(setting =>
            setting.key === key ? { ...setting, value } : setting
          )
        : [...current, { key, value }];
    });
  };

  const handleSubmitSchedules = async data => {
    setLoading(true);
    try {
      setSchedules(data);
      await updateSchedules({ id: company.id, schedules: data });
      toast.success("Horários atualizados com sucesso.");
    } catch (e) {
      toast.error(e);
    }
    setLoading(false);
  };

  const isSuper = () => {
    return currentUser.super;
  };

  const isAdmin = () => {
    return canSeeScreen(currentUser, "settings");
  };

  const renderizarSecao = tab => (
    <Paper
      className={classes.paper}
      elevation={0}
      style={{ padding: 0, overflow: "visible", border: 0 }}
    >
      <TabPanel className={classes.container} value={tab} name={"schedules"}>
        {isOpenHoursFormat(schedules) ? (
          <>
            <OpenHoursEditor
              value={{ timezone: company.timezone, ...schedules }}
              onChange={setSchedules}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSubmitSchedules(schedules)}
                disabled={loading}
              >
                {loading ? i18n.t("settings.saving") : i18n.t("common.save")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Grid spacing={4} container>
              <Grid item xs={12}>
                <div>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() =>
                      setSchedules({ timezone: company.timezone || undefined })
                    }
                    disabled={loading}
                  >
                    ⚠️ {i18n.t("settings.schedules.updateToNewFormat")}
                  </Button>
                </div>
              </Grid>
            </Grid>
            <SchedulesForm
              loading={loading}
              onSubmit={handleSubmitSchedules}
              initialValues={schedules}
            />
          </>
        )}
      </TabPanel>
      <TabPanel className={classes.container} value={tab} name={"whitelabel"}>
        {isAdmin() &&
          (settingsStatus === "ready" ? (
            <Whitelabel
              settings={settings}
              onSettingSaved={handleSettingSaved}
            />
          ) : settingsStatus === "error" ? (
            <div role="alert">
              <p>{i18n.t("loginExperience.settingsLoadError")}</p>
              <Button
                onClick={retrySettings}
                variant="outlined"
                color="primary"
              >
                {i18n.t("loginExperience.retrySettings")}
              </Button>
            </div>
          ) : (
            <p role="status">{i18n.t("loginExperience.loading")}</p>
          ))}
      </TabPanel>
      <TabPanel className={classes.container} value={tab} name={"voiceCalls"}>
        <VoiceSettings />
      </TabPanel>
      <TabPanel className={classes.container} value={tab} name={"helps"}>
        <HelpsManager />
      </TabPanel>
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <>
            <TabPanel className={classes.container} value={tab} name={"agent"}>
              <AgentContextManager />
            </TabPanel>
            <TabPanel
              className={classes.container}
              value={tab}
              name={"whatsappStatus"}
            >
              <WhatsappStatusTenants />
            </TabPanel>
            <TabPanel
              className={classes.container}
              value={tab}
              name={"paymentGateway"}
            >
              <PaymentGateway settings={settings} />
            </TabPanel>
            <TabPanel className={classes.container} value={tab} name={"i18n"}>
              <I18nSettings />
            </TabPanel>
            <TabPanel
              className={classes.container}
              value={tab}
              name={"companies"}
            >
              <CompaniesManager />
            </TabPanel>
            <TabPanel className={classes.container} value={tab} name={"plans"}>
              <PlansManager />
            </TabPanel>
            <TabPanel
              className={classes.container}
              value={tab}
              name={"partners"}
            >
              <PartnersManager />
            </TabPanel>
          </>
        )}
      />
      <TabPanel className={classes.container} value={tab} name={"options"}>
        <Options
          settings={settings}
          scheduleTypeChanged={value =>
            setSchedulesEnabled(value === "company")
          }
        />
      </TabPanel>
    </Paper>
  );

  return (
    <MainContainer className="sd-business sd-settings">
      <MainHeader>
        <CabecalhoPagina
          titulo={i18n.t("settings.title")}
          descricao={i18n.t("redesign.descricaoConfiguracoes")}
        />
      </MainHeader>
      <div style={{ overflow: "auto", flex: 1 }}>
        <CentralConfiguracoes
          conteudo={renderizarSecao}
          aoAlternar={atualizarConfiguracoes}
          superusuario={isSuper()}
          administrador={isAdmin()}
          horarios={schedulesEnabled}
          voz={voiceAvailable}
        />
      </div>
    </MainContainer>
  );
};
export default SettingsCustom;
