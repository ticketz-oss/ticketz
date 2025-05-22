import React, { useState, useEffect } from "react";
import {
  Paper,
  Container,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  FormHelperText,
  Typography,
  Box,
  Card,
  CardContent,
  Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue, green, orange, purple, red, deepPurple, indigo } from "@material-ui/core/colors";
import { toast } from "react-toastify";
import clsx from "clsx";
import { isEmpty, isArray } from "lodash";
import moment from "moment";
import {
  Speed as SpeedIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  Call as CallIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  GroupAdd as GroupAddIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Forum as ForumIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Send as SendIcon,
  Message as MessageIcon,
  AccessAlarm as AccessAlarmIcon,
  Timer as TimerIcon
} from "@material-ui/icons";

import Chart from "./Chart";
import ButtonWithSpinner from "../../components/ButtonWithSpinner";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import useDashboard from "../../hooks/useDashboard";
import useCompanies from "../../hooks/useCompanies";
import { i18n } from "../../translate/i18n";
import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { loadJSON } from "../../helpers/loadJSON";
import config from "../../services/config";
import api from "../../services/api.js";

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
    height: 300,
    borderRadius: 12,
    boxShadow: "0 8px 16px 0 rgba(0,0,0,0.1)",
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  card: {
    padding: theme.spacing(3),
    height: "100%",
    borderRadius: 12,
    boxShadow: "0 4px 12px 0 rgba(0,0,0,0.08)",
    transition: "transform 0.3s, box-shadow 0.3s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 16px 0 rgba(0,0,0,0.12)",
    },
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  cardIcon: {
    fontSize: "3.5rem",
    opacity: 0.2,
    position: "absolute",
    right: theme.spacing(2),
    bottom: theme.spacing(2),
  },
  filterContainer: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: 12,
    marginBottom: theme.spacing(3),
    boxShadow: "0 4px 12px 0 rgba(0,0,0,0.05)",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  cardContent: {
    position: "relative",
    paddingBottom: theme.spacing(6),
  },
  card1: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  card2: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
  card3: {
    backgroundColor: purple[500],
    color: theme.palette.getContrastText(purple[500]),
  },
  card4: {
    backgroundColor: orange[500],
    color: theme.palette.getContrastText(orange[500]),
  },
  card5: {
    backgroundColor: green[500],
    color: theme.palette.getContrastText(green[500]),
  },
  card6: {
    backgroundColor: deepPurple[500],
    color: theme.palette.getContrastText(deepPurple[500]),
  },
  card7: {
    backgroundColor: indigo[500],
    color: theme.palette.getContrastText(indigo[500]),
  },
  card8: {
    backgroundColor: red[500],
    color: theme.palette.getContrastText(red[500]),
  },
  card9: {
    backgroundColor: "#3f51b5",
    color: theme.palette.getContrastText("#3f51b5"),
  },
  statusTable: {
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 12px 0 rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    marginBottom: theme.spacing(3),
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [companyDueDate, setCompanyDueDate] = useState();
  const [currentUser, setCurrentUser] = useState({});
  const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();
  const { finding } = useCompanies();
  const { getCurrentUserInfo } = useAuth();

  useEffect(() => {
    getCurrentUserInfo().then((user) => {
      if (user?.profile !== "admin") {
        window.location.href = "/tickets";
      }
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
  }, []);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function handleChangeFilterType(value) {
    setFilterType(value);
    if (value === 1) {
      setPeriod(0);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (period > 0) {
      params = {
        days: period,
      };
    }

    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
    }

    const data = await find(params);

    if (!data) {
      setLoading(false);
      return;
    }

    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function fetchData() {
      await loadCompanies();
    }
    fetchData();
  }, []);

  const companyId = localStorage.getItem("companyId");
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const companiesList = await finding(companyId);
      setCompanyDueDate(moment(companiesList.dueDate).format("DD/MM/yyyy"));
    } catch (e) {
      console.log("🚀 Console Log : e", e);
    }
    setLoading(false);
  };

  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

  function renderFilters() {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              fullWidth
            />
          </Grid>
        </>
      );
    } else {
      return (
        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={classes.selectContainer} variant="outlined">
            <InputLabel id="period-selector-label">Período</InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={(e) => handleChangePeriod(e.target.value)}
              label="Período"
            >
              <MenuItem value={0}>Nenhum selecionado</MenuItem>
              <MenuItem value={3}>Últimos 3 dias</MenuItem>
              <MenuItem value={7}>Últimos 7 dias</MenuItem>
              <MenuItem value={15}>Últimos 15 dias</MenuItem>
              <MenuItem value={30}>Últimos 30 dias</MenuItem>
              <MenuItem value={60}>Últimos 60 dias</MenuItem>
              <MenuItem value={90}>Últimos 90 dias</MenuItem>
            </Select>
            <FormHelperText>Selecione o período desejado</FormHelperText>
          </FormControl>
        </Grid>
      );
    }
  }

  if (currentUser?.profile !== "admin") {
    return <div></div>;
  }

  const stats = [
    {
      title: "Atd. Pendentes",
      value: counters.supportPending || 0,
      icon: <CallIcon className={classes.cardIcon} />,
      className: classes.card1,
    },
    {
      title: "Atd. Acontecendo",
      value: counters.supportHappening || 0,
      icon: <HourglassEmptyIcon className={classes.cardIcon} />,
      className: classes.card2,
    },
    {
      title: "Finalizados",
      value: counters.supportFinished || 0,
      icon: <CheckCircleIcon className={classes.cardIcon} />,
      className: classes.card3,
    },
    {
      title: "Novos Contatos",
      value: counters.leads || 0,
      icon: <GroupAddIcon className={classes.cardIcon} />,
      className: classes.card4,
    },
    {
      title: "T.M. de Atendimento",
      value: formatTime(counters.avgSupportTime) || "00h 00m",
      icon: <AccessAlarmIcon className={classes.cardIcon} />,
      className: classes.card8,
    },
    {
      title: "T.M. de Espera",
      value: formatTime(counters.avgWaitTime) || "00h 00m",
      icon: <TimerIcon className={classes.cardIcon} />,
      className: classes.card9,
    },
  ];

  return (
    <Container maxWidth="lg" className={classes.container}>
      {/* FILTERS SECTION */}
      <Paper className={classes.filterContainer}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Filtros
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={classes.selectContainer} variant="outlined">
              <InputLabel id="period-selector-label">Tipo de Filtro</InputLabel>
              <Select
                labelId="period-selector-label"
                value={filterType}
                onChange={(e) => handleChangeFilterType(e.target.value)}
                label="Tipo de Filtro"
              >
                <MenuItem value={1}>Filtro por Data</MenuItem>
                <MenuItem value={2}>Filtro por Período</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {renderFilters()}

          <Grid item xs={12} className={classes.alignRight}>
            <ButtonWithSpinner
              loading={loading}
              onClick={() => fetchData()}
              variant="contained"
              color="primary"
              size="large"
            >
              Aplicar Filtros
            </ButtonWithSpinner>
          </Grid>
        </Grid>
      </Paper>

      {/* CHART SECTION */}
      <Box mb={4}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Estatísticas de Atendimento
        </Typography>
        <Paper className={classes.fixedHeightPaper}>
          <Chart />
        </Paper>
      </Box>

      {/* STATS CARDS */}
      <Box mb={4}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Métricas Principais
        </Typography>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card className={clsx(classes.card, stat.className)}>
                <CardContent className={classes.cardContent}>
                  <Typography className={classes.cardTitle}>
                    {stat.title}
                  </Typography>
                  <Typography className={classes.cardValue}>
                    {stat.value}
                  </Typography>
                  {stat.icon}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ATTENDANTS TABLE */}
      {attendants.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Status dos Atendentes
          </Typography>
          <Paper className={classes.statusTable}>
            <TableAttendantsStatus attendants={attendants} loading={loading} />
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;
