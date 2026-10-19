import StardewEmblem from "../../components/StardewEmblem";
import React, { useState, useEffect, useContext } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  RefreshCw,
  LayoutDashboard,
  Radio,
  ChartNoAxesCombined
} from "lucide-react";
import { Botao, useIdentidade } from "../../components/interface";
import CabecalhoPagina from "../../components/CabecalhoPagina";
import FilasAoVivo from "./FilasAoVivo";
import "./painel.css";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";

import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

import { isEmpty } from "lodash";
import moment from "moment";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

import { SmallPie } from "./SmallPie";
import { TicketCountersChart } from "./TicketCountersChart";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset.js";

import api from "../../services/api.js";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";
import { canSeeScreen } from "../../helpers/screenAccess";
import ContactFlowReportDialog from "./ContactFlowReportDialog";

const useStyles = makeStyles(() => ({
  selectContainer: { width: "100%" },
  fullWidth: { width: "100%" }
}));

function Indicador({ titulo, valor, item = "chest" }) {
  return (
    <div className="painel-indicador">
      <StardewEmblem item={item} className="sv-metric-emblem" />
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

const Dashboard = () => {
  const classes = useStyles();
  const identidade = useIdentidade();
  const [period, setPeriod] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const { user: currentUser } = useContext(AuthContext);
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DDTHH") + ":00"
  );
  const [dateTo, setDateTo] = useState(
    moment().format("YYYY-MM-DDTHH") + ":59"
  );

  const [usersOnlineTotal, setUsersOnlineTotal] = useState(0);
  const [usersOfflineTotal, setUsersOfflineTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingChartData, setPendingChartData] = useState([]);
  const [openedTotal, setOpenedTotal] = useState(0);
  const [openedChartData, setOpenedChartData] = useState([]);

  const [ticketsData, setTicketsData] = useState({});
  const [usersData, setUsersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const socketManager = useContext(SocketContext);
  const companyId = localStorage.getItem("companyId");

  useEffect(() => {
    const socket = socketManager.GetSocket(companyId);

    socket.on("userOnlineChange", updateStatus);
    socket.on("counter", updateStatus);

    return () => {
      socket.disconnect();
    };
  }, [socketManager, companyId]);

  useEffect(() => {
    if (currentUser?.id && !canSeeScreen(currentUser, "dashboard")) {
      window.location.href = "/tickets";
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function updateStatus() {
    api
      .get("/dashboard/status")
      .then(result => {
        const { data } = result;

        if (!data) return;

        let usersOnlineTotal = 0;
        let usersOfflineTotal = 0;
        data.usersStatusSummary.forEach(item => {
          if (item.online) {
            usersOnlineTotal++;
          } else {
            usersOfflineTotal++;
          }
        });

        setUsersOnlineTotal(usersOnlineTotal);
        setUsersOfflineTotal(usersOfflineTotal);

        let pendingTotal = 0;
        let openedTotal = 0;
        const pendingChartData = [];
        const openedChartData = [];
        data.ticketsStatusSummary.forEach(item => {
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
      })
      .catch(() => {});
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

    api
      .get("/dashboard/tickets", { params })
      .then(result => {
        if (result?.data) {
          setTicketsData(result.data);
        }
      })
      .catch(() => {});

    setLoadingUsers(true);
    api
      .get("/dashboard/users", { params })
      .then(result => {
        if (result?.data) {
          setUsersData(result.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }

  useEffect(() => {
    updateStatus();
  }, []);

  function renderFilters() {
    return (
      <>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="period-selector-label">
              {i18n.t("dashboard.filter.period")}
            </InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={e => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>{i18n.t("dashboard.filter.custom")}</MenuItem>
              <MenuItem value={3}>
                {i18n.t("dashboard.filter.last3days")}
              </MenuItem>
              <MenuItem value={7}>
                {i18n.t("dashboard.filter.last7days")}
              </MenuItem>
              <MenuItem value={15}>
                {i18n.t("dashboard.filter.last14days")}
              </MenuItem>
              <MenuItem value={30}>
                {i18n.t("dashboard.filter.last30days")}
              </MenuItem>
              <MenuItem value={90}>
                {i18n.t("dashboard.filter.last90days")}
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {!period && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={i18n.t("dashboard.date.start")}
                type="datetime-local"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                onBlur={fetchData}
                className={classes.fullWidth}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={i18n.t("dashboard.date.end")}
                type="datetime-local"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                onBlur={fetchData}
                className={classes.fullWidth}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
          </>
        )}
      </>
    );
  }

  if (!canSeeScreen(currentUser, "dashboard")) {
    return <div></div>;
  }

  return (
    <div
      className="ew-ui pagina-painel sv-operations sv-screen-dashboard"
      style={identidade}
    >
      <header className="painel-cabecalho">
        <StardewEmblem item="sun" />
        <CabecalhoPagina
          titulo={i18n.t("redesign.visaoGeral")}
          descricao={i18n.t("redesign.descricaoPainel")}
        />
        <Botao onClick={() => setReportOpen(true)}>
          {i18n.t("dashboard.contactReport.button", {
            defaultValue: "Exportar contatos"
          })}
        </Botao>
        <Botao
          onClick={() => {
            fetchData();
            updateStatus();
          }}
        >
          <RefreshCw size={16} />
          {i18n.t("visual.atualizar")}
        </Botao>
      </header>
      <ContactFlowReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
      <Tabs.Root defaultValue="resumo">
        <Tabs.List className="ew-tabs" aria-label={i18n.t("visual.resumo")}>
          <Tabs.Trigger className="ew-tab" value="resumo">
            <LayoutDashboard size={15} />
            {i18n.t("visual.resumo")}
          </Tabs.Trigger>
          <Tabs.Trigger className="ew-tab" value="aoVivo">
            <Radio size={15} />
            {i18n.t("visual.aoVivo")}
          </Tabs.Trigger>
          <Tabs.Trigger className="ew-tab" value="desempenho">
            <ChartNoAxesCombined size={15} />
            {i18n.t("visual.desempenho")}
          </Tabs.Trigger>
        </Tabs.List>
        <section
          className="painel-card painel-filtros"
          aria-label={i18n.t("visual.periodo")}
        >
          <Grid container spacing={3}>
            {renderFilters()}
          </Grid>
        </section>
        <Tabs.Content value="resumo">
          <div className="painel-indicadores">
            <Indicador
              titulo={i18n.t("dashboard.ticketsOpen")}
              valor={openedTotal}
            />
            <Indicador
              item="scroll"
              titulo={i18n.t("dashboard.ticketsWaiting")}
              valor={pendingTotal}
            />
            <Indicador
              item="star"
              titulo={i18n.t("dashboard.ticketsDone")}
              valor={ticketsData.ticketStatistics?.totalClosed ?? "—"}
            />
            <Indicador
              item="sprout"
              titulo={i18n.t("dashboard.newContacts")}
              valor={ticketsData.ticketStatistics?.newContacts ?? "—"}
            />
            <Indicador
              item="clock"
              titulo={i18n.t("dashboard.avgServiceTime")}
              valor={formatTimeInterval(
                ticketsData.ticketStatistics?.avgServiceTime
              )}
            />
            <Indicador
              item="clock"
              titulo={i18n.t("dashboard.avgWaitTime")}
              valor={formatTimeInterval(
                ticketsData.ticketStatistics?.avgWaitTime
              )}
            />
          </div>
          <div className="painel-graficos">
            <section className="painel-card painel-grafico">
              <TicketCountersChart
                ticketCounters={ticketsData.ticketCounters}
              />
            </section>
            <section className="painel-card">
              <h2>{i18n.t("visual.filasAgora")}</h2>
              <p>{i18n.t("visual.distribuicaoFilas")}</p>
              <div className="painel-rosca">
                <SmallPie chartData={openedChartData} size={160} />
                <strong>{openedTotal}</strong>
              </div>
              <div className="painel-legenda">
                {openedChartData.map((fila, indice) => (
                  <div key={`${fila.name}-${indice}`}>
                    <i style={{ background: fila.color }} />
                    <span>{fila.name}</span>
                    <b>{fila.value}</b>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="painel-card painel-tabela">
            <h2>{i18n.t("visual.desempenho")}</h2>
            <TableAttendantsStatus
              attendants={usersData.userReport || []}
              loading={loadingUsers}
            />
          </section>
        </Tabs.Content>
        <Tabs.Content value="aoVivo">
          <div className="painel-indicadores painel-indicadores--tres">
            <Indicador
              item="villager"
              titulo={i18n.t("dashboard.usersOnline")}
              valor={`${usersOnlineTotal}/${usersOnlineTotal + usersOfflineTotal}`}
            />
            <Indicador
              item="scroll"
              titulo={i18n.t("dashboard.ticketsWaiting")}
              valor={pendingTotal}
            />
            <Indicador
              titulo={i18n.t("dashboard.ticketsOpen")}
              valor={openedTotal}
            />
          </div>
          <FilasAoVivo abertas={openedChartData} pendentes={pendingChartData} />
          <section className="painel-card painel-tabela">
            <h2>{i18n.t("visual.atendentes")}</h2>
            <TableAttendantsStatus
              attendants={usersData.userReport || []}
              loading={loadingUsers}
            />
          </section>
        </Tabs.Content>
        <Tabs.Content value="desempenho">
          <section className="painel-card painel-tabela">
            <h2>{i18n.t("visual.desempenho")}</h2>
            <TableAttendantsStatus
              attendants={usersData.userReport || []}
              loading={loadingUsers}
            />
          </section>
          <section className="painel-card painel-grafico">
            <TicketCountersChart ticketCounters={ticketsData.ticketCounters} />
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
export default Dashboard;
