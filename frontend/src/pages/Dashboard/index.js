import React, { useState, useEffect, useContext } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

// ICONS
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import TimerIcon from '@material-ui/icons/Timer';

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

import { isEmpty } from "lodash";
import moment from "moment";
import { i18n } from "../../translate/i18n";
import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import clsx from "clsx";
import { loadJSON } from "../../helpers/loadJSON";

import { SmallPie } from "./SmallPie";
import { TicketCountersChart } from "./TicketCountersChart";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset.js";

import TicketzRegistry from "../../components/TicketzRegistry";
import { copyToClipboard } from "../../helpers/copyToClipboard.js";
import api from "../../services/api.js";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";

const gitinfo = loadJSON('/gitinfo.json');

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  pixkey: {
    fontSize: "9pt",
  },
  paymentimg: {
    maxWidth: "75%",
    marginTop: 10,
  },
  paymentpix: {
    maxWidth: "100%",
    maxHeight: 130,
    padding: "5px",
    backgroundColor: "white",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "2px",
  },
  supportPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    overflowY: "clip",
    height: 300,
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    ...theme.scrollbarStyles,
  },
  supportBox: {
    backgroundColor: theme.palette.secondary.light,
    borderRadius: "10px",
    textAlign: "center",
    borderColor: theme.palette.secondary.main,
    borderWidth: "3px",
    borderStyle: "solid",
    transition: "max-height 0.5s ease",
    overflow: "clip"
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  cardSolid: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "hidden",
    flexDirection: "row",
    height: "100%",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  cardGray: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "hidden",
    flexDirection: "row",
    height: "100%",
    color: theme.palette.primary.main,
  },
  cardData: {
    display: "block",
    width: "100%",
    zIndex: 1,
  },
  cardIcon: {
    width: 100,
    color: theme.palette.primary.light,
    position: "sticky",
    opacity: 0.4,
    right: 0,
  },
  cardRingGraph: {
    width: 100,
    position: "sticky",
    right: 0,
  },
  ticketzProPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    minHeight: 300,
    backgroundColor: theme.palette.ticketzproad.main,
    color: theme.palette.ticketzproad.contrastText,
    ...theme.scrollbarStyles,
  },
  ticketzRegistryPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    backgroundColor: theme.palette.background.main,
    color: theme.palette.background.contrastText,
    borderColor: theme.palette.primary.main,
    borderWidth: "3px",
    borderStyle: "solid",
    marginBottom: "1em",
    ...theme.scrollbarStyles,
  },
  ticketzProBox: {
    textAlign: "center",
    alignContent: "center"
  },
  ticketzProTitle: {
    fontWeight: "bold"
  },
  ticketzProScreen: {
    maxHeight: "300px",
    maxWidth: "100%"
  },
  ticketzProFeatures: {
    padding: 0,
    listStyleType: "none"
  },
  ticketzProCommand: {
    fontFamily: "monospace",
    backgroundColor: "#00000080"
  },
  clickpointer: {
    cursor: "pointer"
  }
}));

const InfoCard = ({ title, value, icon }) => {
  const classes = useStyles();
  
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        className={classes.cardGray}
        elevation={6}
      >
        <div className={classes.cardData}>
          <Typography
            component="h3"
            variant="h6"
            paragraph
          >
            {title}
          </Typography>
          <Typography
            component="h1"
            variant="h4"
          >
            {value}
          </Typography>
        </div>
        <div className={classes.cardIcon}>
          {icon}
        </div>
      </Paper>
    </Grid>
  )
}

const InfoRingCard = ({ title, value, graph }) => {
  const classes = useStyles();
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Paper
        className={classes.cardSolid}
        elevation={4}
      >
        <div className={classes.cardData}>
          <Typography
            component="h3"
            variant="h6"
            paragraph
          >
            {title}
          </Typography>
          <Typography
            component="h1"
            variant="h4"
          >
            {value}
          </Typography>
        </div>
        <div className={classes.cardRingGraph}>
          <div style={{ width: "100px", height: "100px" }}>
            {graph}
          </div>
        </div>
      </Paper>
    </Grid>
  )
};

const Dashboard = () => {
  const classes = useStyles();
  const [period, setPeriod] = useState(0);
  const [currentUser, setCurrentUser] = useState({});
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DDTHH") + ":00"
  );
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DDTHH") + ":59");
  const { getCurrentUserInfo } = useAuth();
    
  const [supportPix, setSupportPix] = useState(false);
  const [supportIsBr, setSupportIsBr] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [proInstructionsOpen, setProInstructionsOpen] = useState(false);
  
  const [usersOnlineTotal, setUsersOnlineTotal] = useState(0);
  const [usersOfflineTotal, setUsersOfflineTotal] = useState(0);
  const [usersStatusChartData, setUsersStatusChartData] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingChartData, setPendingChartData] = useState([]);
  const [openedTotal, setOpenedTotal] = useState(0);
  const [openedChartData, setOpenedChartData] = useState([]);
  
  const [ticketsData, setTicketsData] = useState({});
  const [usersData, setUsersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const socketManager = useContext(SocketContext);
    
  async function showProInstructions() {
    if (gitinfo.commitHash) {
      setProInstructionsOpen(true);
      return;
    }
    
    window.open("https://pro.ticke.tz", "_blank");
  }
  
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country === 'BR') {
          setSupportPix(true);
          setSupportIsBr(true);
        }
      });
  }, []);
  
  useEffect(() => {
    const socket = socketManager.GetSocket(companyId);
    
    socket.on("userOnlineChange", updateStatus);
    socket.on("counter", updateStatus);

    return () => {
      socket.disconnect();
    }
  }, [socketManager]);
  
  useEffect(() => {
    getCurrentUserInfo().then(
      (user) => {
        if (user?.profile !== "admin") {
          window.location.href = "/tickets";
        }
        setCurrentUser(user);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(async () => {
    const registry = await api.get("/ticketz/registry");

    setRegistered( registry?.data?.disabled || !!(registry?.data?.whatsapp ) );
  }, []);
    
  useEffect(() => {
    fetchData();
  }, [period]);
  
  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function updateStatus() {
    const { data } = await api.get("/dashboard/status");
    
    if (!data) return;

    let usersOnlineTotal = 0;
    let usersOfflineTotal = 0;
    data.usersStatusSummary.forEach((item) => {
      if (item.online) {
        usersOnlineTotal++;
      } else {
        usersOfflineTotal++;
      }
    });

    setUsersStatusChartData([
      {
        name: "Online",
        value: usersOnlineTotal,
        color: "#00ff00"
      },
      {
        name: "Offline",
        value: usersOfflineTotal,
        color: "#ff0000"
      }
    ]);

    setUsersOnlineTotal(usersOnlineTotal);
    setUsersOfflineTotal(usersOfflineTotal);

    let pendingTotal = 0;
    let openedTotal = 0;
    const pendingChartData = [];
    const openedChartData = [];
    data.ticketsStatusSummary.forEach((item) => {
      if (item.status === "pending") {
        pendingTotal += Number(item.count);
        pendingChartData.push({
          name: item.queue?.name || i18n.t("common.noqueue"),
          value: Number(item.count),
          color: item.queue?.color || "#888"
          });
        return;
      }
      if (item.status === "open") {
        openedTotal += Number(item.count);
        openedChartData.push({
          name: item.queue?.name || i18n.t("common.noqueue"),
          value: Number(item.count),
          color: item.queue?.color || "#888" 
        });
      }
    });
    setPendingTotal(pendingTotal);
    setPendingChartData(pendingChartData);
    setOpenedTotal(openedTotal);
    setOpenedChartData(openedChartData);
  }
  
  async function fetchData() {
    let params = { tz: getTimezoneOffset() };
    
    const days = Number(period);

    if (days) {
      params = {
        date_from: moment().subtract(days, "days").format("YYYY-MM-DD"),
        date_to: moment().format("YYYY-MM-DD")
      };
    }

    if (!days && !isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
        hour_from: moment(dateFrom).format("HH:mm:ss")
      };
    }

    if (!days && !isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
        hour_to: moment(dateTo).format("HH:mm:ss")
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error(i18n.t("dashboard.filter.invalid"));
      return;
    }

    api.get("/dashboard/tickets", { params }).then(
      result => {
        if (result?.data) {
          setTicketsData(result.data);
        }
      });

    setLoadingUsers(true);
    api.get("/dashboard/users", { params }).then(
      result => {
        if (result?.data) {
          setUsersData(result.data);
          setLoadingUsers(false);
        }
      });
  }

  useEffect(() => {
    updateStatus();
  }, [])

  const companyId = localStorage.getItem("companyId");

  function renderFilters() {
      return (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="period-selector-label">{i18n.t("dashboard.filter.period")}</InputLabel>
              <Select
                labelId="period-selector-label"
                id="period-selector"
                value={period}
                onChange={(e) => handleChangePeriod(e.target.value)}
              >
                <MenuItem value={0}>{i18n.t("dashboard.filter.custom")}</MenuItem>
                <MenuItem value={3}>{i18n.t("dashboard.filter.last3days")}</MenuItem>
                <MenuItem value={7}>{i18n.t("dashboard.filter.last7days")}</MenuItem>
                <MenuItem value={15}>{i18n.t("dashboard.filter.last14days")}</MenuItem>
                <MenuItem value={30}>{i18n.t("dashboard.filter.last30days")}</MenuItem>
                <MenuItem value={90}>{i18n.t("dashboard.filter.last90days")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {!period &&
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={i18n.t("dashboard.date.start")}
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onBlur={fetchData}
                  className={classes.fullWidth}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={i18n.t("dashboard.date.end")}
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onBlur={fetchData}
                  className={classes.fullWidth}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </>
          }
          <Grid item xs={12} sm={6} md={period ? 9 : 3} />
        </>
      );
  }

  if (currentUser?.profile !== "admin") {
    return (
      <div>
      </div>
    );
  }
      
  return (
    <div>
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={3} justifyContent="flex-start">

          { !localStorage.getItem("hideAds") && <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <>
              <Grid item xs={12}>
                {!registered &&
                  <Paper className={classes.ticketzRegistryPaper}>
                    <TicketzRegistry onRegister={setRegistered} />
                  </Paper>
                }
              </Grid>
              <Grid item lg={8} sm={12}>
                <Paper className={clsx(classes.ticketzProPaper, {
                  [classes.clickpointer]: !proInstructionsOpen,
                })} onClick={() => showProInstructions()}>
                  <Grid container justifyContent="flex-end">
                    <Grid className={classes.ticketzProBox} item xs={12} md={proInstructionsOpen ? 4 : 6} sm={12}>
                      <div>
                        <img className={classes.ticketzProScreen} src="https://pro.ticke.tz/images/0/7/3/0/b/0730b234af7b4b0dac72d09828863bb7cb9193ea-ticketz-computador.png" />
                      </div>
                    </Grid>
                    { !proInstructionsOpen &&
                    <Grid className={classes.ticketzProBox} item xs={12} md={6} sm={12}>
                      <Typography className={classes.ticketzProTitle} component="h3" variant="h5" gutterBottom>
                        Ticketz PRO
                      </Typography>
                      <Typography component="h4" variant="h7" gutterBottom>
                      <ul className={classes.ticketzProFeatures}>
                        <li>Whatsapp Oficial - Instagram - Messenger e outros</li>
                        <li>Features exclusivas</li>
                        <li>Suporte Avançado</li>
                        <li>Migração Facilitada</li>
                      </ul>
                      </Typography>
                      <Typography component="h3" variant="h5">
                        Assine por R$ 199/mês
                      </Typography>
                      <Typography component="h3" variant="h7" gutterBottom>
                        direto dentro do sistema
                      </Typography>
                      { gitinfo.commitHash && 
                      <Typography component="h4" variant="h6">
                        Clique para instruções de Upgrade
                      </Typography>
                      }
                      { !gitinfo.commitHash && 
                      <Typography component="h3" variant="h5">
                        Clique para visitar o site!
                      </Typography>
                      }
                    </Grid>
                    }
                    { proInstructionsOpen &&
                    <Grid className={classes.ticketzProBox} item xs={12} md={8} sm={12}>
                      <Typography className={classes.ticketzProTitle} component="h3" variant="h5" gutterBottom>
                        Instruções de Upgrade
                      </Typography>
                      <Typography paragraph>
                        Se você instalou as imagens disponibilizadas pelo projeto em um
                        servidor ou VPS utilizando as instruções facilitadas tudo o que
                        você precisa fazer é acessar seu servidor e digitar o comando abaixo:
                      </Typography>
                      <Typography className={classes.ticketzProCommand} paragraph>
                        curl -sSL update.ticke.tz | sudo bash -s pro
                      </Typography>
                      <Typography paragraph>
                        Em instantes o Ticketz PRO estará instalado com todos os teus dados,
                        agora só precisa ir até o menu de usuário, clicar em "Assinatura do
                        Ticketz PRO" e fazer a sua assinatura.
                      </Typography>
                      <Typography paragraph>
                        Se a tua instalação for diferente ou acredita que precisa
                        de auxílio para instalar o Ticketz
                        Pro, <a href="https://wa.me/554935670707"> entre
                        em contato</a> que nós ajudamos!
                      </Typography>
                    </Grid>
                    }
                  </Grid>
                </Paper>
              </Grid>
              </>
            )} />
          }

          { !localStorage.getItem("hideAds") && <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <Grid item lg={4} sm={12}>
                <Paper className={classes.supportPaper}>
                  <Typography style={{ overflow: "hidden" }} component="h2" variant="h6" gutterBottom>
                    {i18n.t("ticketz.support.title")}
                  </Typography>
                    <Grid container justifyContent="flex-end">
                      <Grid className={classes.supportBox} style={{maxHeight: supportPix ? 300 : 35} } item xs={12}>
                        <Typography
                          className={classes.clickpointer}
                          component="h3" variant="h6"
                          gutterBottom onClick={() => setSupportPix(true)}>
                          PIX
                        </Typography>
                        <div
                          className={classes.clickpointer}
                          onClick={() => {
                            copyToClipboard("1ab11506-9480-4303-8e1e-988e7c49ed4d");
                            toast.success("Chave PIX copiada");
                          }
                          }>
                          <div>
                            <img className={classes.paymentpix} src="/ticketzpix.png" />
                          </div>
                          <Typography className={classes.pixkey} component="body2" paragraph>
                            Clique para copiar a chave PIX
                          </Typography>
                        </div>
                      </Grid>
                      <Grid className={classes.supportBox}  style={{maxHeight: supportPix ? 35 : 300 }} item xs={12} onClick={() => setSupportPix(false)}>
                        <Typography
                          className={classes.clickpointer}
                          component="h3" variant="h6"
                          gutterBottom onClick={() => setSupportPix(true)}>
                          {i18n.t("ticketz.support.mercadopagotitle")}
                        </Typography>
                        { supportPix || <> 
                        {supportIsBr && <>
                          <Typography component="body2" paragraph>
                            {i18n.t("ticketz.support.recurringbrl")}
                          </Typography>
                          <div><a href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380848f1b8ed1018f2b011f90061f" target="_blank">
                            <img className={classes.paymentimg} src="/mercadopago.png" />
                          </a></div>
                        </>}
                        {!supportIsBr && <>
                          <Typography component="body2" paragraph>
                            {i18n.t("ticketz.support.international")}
                          </Typography>
                          <div><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X6XHVCPMRQEL4" target="_blank">
                            <img className={classes.paymentimg} src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" />
                          </a></div>
                        </>}
                        </> }
                      </Grid>
                    </Grid>
                </Paper>
              </Grid>
            )} /> }

          {/* USUARIOS ONLINE */}
          <InfoRingCard
            title={i18n.t("dashboard.usersOnline")}
            value={`${usersOnlineTotal}/${usersOnlineTotal + usersOfflineTotal}`}
            graph={
              <SmallPie chartData={usersStatusChartData} />
            }
          />

          {/* ATENDIMENTOS PENDENTES */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsWaiting")}
            value={pendingTotal}
            graph={
              <SmallPie chartData={pendingChartData} />
            }
          />

          {/* ATENDIMENTOS ACONTECENDO */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsOpen")}
            value={openedTotal}
            graph={
              <SmallPie chartData={openedChartData} />
            }
          />

          {/* FILTROS */}
          {renderFilters()}

          {/* ATENDIMENTOS REALIZADOS */}
          <InfoCard
            title={i18n.t("dashboard.ticketsDone")}
            value={ticketsData.ticketStatistics?.totalClosed || 0}
            icon={<CheckCircleIcon style={{ fontSize: 100 }} />}
          />

          {/* NOVOS CONTATOS */}
          <InfoCard
            title={i18n.t("dashboard.newContacts")}
            value={ticketsData.ticketStatistics?.newContacts || 0}
            icon={<GroupAddIcon style={{ fontSize: 100 }} />}
          />

          {/* T.M. DE ATENDIMENTO */}
          <InfoCard
            title={i18n.t("dashboard.avgServiceTime")}
            value={formatTimeInterval(ticketsData.ticketStatistics?.avgServiceTime)}
            icon={<TimerIcon style={{ fontSize: 100 }} />}
          />

          {/* T.M. DE ESPERA */}
          <InfoCard
            title={i18n.t("dashboard.avgWaitTime")}
            value={formatTimeInterval(ticketsData.ticketStatistics?.avgWaitTime)}
            icon={<HourglassEmptyIcon style={{ fontSize: 100 }} />}
          />

          {/* DASHBOARD ATENDIMENTOS NO PERÍODO */}
          <Grid item xs={12}>
            <Paper className={classes.fixedHeightPaper}>
              <TicketCountersChart
                ticketCounters={ticketsData.ticketCounters}
                start={ticketsData.start}
                end={ticketsData.end}
                hour_start={ticketsData.hour_start}
                hour_end={ticketsData.hour_end}
               />
            </Paper>
          </Grid>


          {/* USER REPORT */}
          <Grid item xs={12}>
            {usersData.userReport?.length ? (
              <TableAttendantsStatus
                attendants={usersData.userReport}
                loading={loadingUsers}
              />
            ) : null}
          </Grid>

        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
