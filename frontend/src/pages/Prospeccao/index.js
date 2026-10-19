import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { Redirect, useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import {
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Switch,
  TablePagination,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import RefreshIcon from "@material-ui/icons/Refresh";
import SettingsIcon from "@material-ui/icons/Settings";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import toastError from "../../errors/toastError";

import CardLead from "./CardLead";
import AutomationDialog from "./AutomationDialog";
import { AuthContext } from "../../context/Auth/AuthContext";
import { podeVerProspeccao } from "../../helpers/prospeccao";

const useStyles = makeStyles(theme => ({
  painel: {
    flex: 1,
    overflowY: "auto",
    padding: theme.spacing(1),
    ...theme.scrollbarStyles
  },
  formulario: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5)
  },
  acoesFormulario: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    flexWrap: "wrap"
  },
  progresso: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5)
  },
  automationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    flexWrap: "wrap"
  },
  automationMetric: {
    paddingTop: theme.spacing(1)
  },
  automationExecutions: {
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`
  },
  automationExecution: {
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0),
    flexWrap: "wrap"
  },
  barra: {
    marginTop: theme.spacing(1)
  },
  filtros: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    flexWrap: "wrap"
  },
  vazio: {
    padding: theme.spacing(4),
    textAlign: "center",
    color: theme.palette.text.secondary
  }
}));

const TONS = [
  { value: "curta", label: "Curta (1-2 frases)" },
  { value: "media", label: "Média (3-4 frases)" },
  { value: "longa", label: "Longa (um parágrafo)" }
];

const FILTROS = [
  { value: "todos", label: "Todos os leads" },
  { value: "nao_contatados", label: "Não contatados" },
  { value: "conversa_aberta", label: "Conversa aberta" },
  { value: "agendados", label: "Envio agendado" },
  { value: "pausados", label: "Pausados" },
  { value: "contatados", label: "Mensagem enviada" },
  { value: "respondidos", label: "Cliente respondeu" },
  { value: "falhas", label: "Falha no envio" },
  { value: "fechados", label: "Fechado sem resposta" }
];

const FORM_INICIAL = {
  nicho: "",
  countryCode: "BR",
  stateCode: "",
  cityName: "",
  maxResultados: 10,
  produto: "",
  tom: "media",
  somenteComWhatsapp: true
};

const CHAVE_ULTIMO_JOB = "prospeccaoUltimoJob";

// Entre a raspagem terminar e o primeiro lead aparecer no bridge roda o
// enriquecimento via Instagram, que é a etapa mais lenta de todas: numa busca
// de 10 leads medimos 4min50s só aí, com a raspagem levando pouco mais de um
// minuto. Lista vazia depois da raspagem é o estado normal desse intervalo, não
// um resultado — por isso não existe aqui nenhuma folga curta declarando
// "nenhum lead": só o orçamento total abaixo interrompe o acompanhamento.
const INTERVALO_POLL_MS = 6000;
const LIMITE_TOTAL_MS = 15 * 60 * 1000;

const rotuloProduto = slug =>
  String(slug || "")
    .split("-")
    .filter(Boolean)
    .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");

const countryLabel = country => {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(
      country.code
    );
  } catch (_) {
    return country.name;
  }
};

const AUTOMATION_STATUS = {
  DUE: "Preparando busca",
  RUNNING: "Buscando no Google Maps",
  ENRICHING: "Gerando rascunhos",
  COMPLETED: "Busca concluída",
  FAILED: "Busca com falha"
};

const horaLocal = value =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value))
    : null;

const ProspeccaoContent = () => {
  const classes = useStyles();
  const history = useHistory();

  const [form, setForm] = useState(FORM_INICIAL);
  const [produtos, setProdutos] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [automation, setAutomation] = useState({ enabled: false });
  const [automationOpen, setAutomationOpen] = useState(false);

  const [jobId, setJobId] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [acompanhando, setAcompanhando] = useState(false);
  const [aviso, setAviso] = useState("");

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(10);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [carregandoLista, setCarregandoLista] = useState(false);

  const [rascunhos, setRascunhos] = useState({});
  const [abrindo, setAbrindo] = useState(null);

  const temporizador = useRef(null);
  const inicioDoJob = useRef(null);
  const raspagemTerminouEm = useRef(null);
  const montado = useRef(true);
  // Trocar de busca não cancela a requisição que já saiu: sem isso, a resposta
  // atrasada da busca anterior sobrescreveria o progresso da nova.
  const jobAcompanhado = useRef(null);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  useEffect(() => {
    const activeSearches = automation.progress?.searchesActive || 0;
    if (!automation.enabled && activeSearches === 0) return undefined;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get("/prospeccao/automacao");
        if (montado.current) setAutomation(data || { enabled: false });
      } catch (error) {
        // O restante da tela continua funcional durante uma falha transitória.
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [automation.enabled, automation.progress?.searchesActive]);

  useEffect(() => {
    Promise.all([
      api.get("/prospeccao/localidades/paises"),
      api.get("/prospeccao/localidades/estados", { params: { pais: "BR" } }),
      api.get("/prospeccao/localidades/cidades", { params: { pais: "BR" } }),
      api.get("/prospeccao/automacao")
    ])
      .then(([countryList, stateList, cityList, automationResult]) => {
        setCountries(countryList.data || []);
        setStates(stateList.data || []);
        setCities(cityList.data || []);
        setAutomation(automationResult.data || { enabled: false });
      })
      .catch(toastError);
  }, []);

  const changeCountry = async event => {
    const countryCode = event.target.value;
    setForm(current => ({
      ...current,
      countryCode,
      stateCode: "",
      cityName: ""
    }));
    try {
      const [{ data: nextStates }, { data: nextCities }] = await Promise.all([
        api.get("/prospeccao/localidades/estados", {
          params: { pais: countryCode }
        }),
        api.get("/prospeccao/localidades/cidades", {
          params: { pais: countryCode }
        })
      ]);
      setStates(nextStates || []);
      setCities(nextCities || []);
    } catch (error) {
      toastError(error);
    }
  };

  const changeState = async event => {
    const stateCode = event.target.value;
    setForm(current => ({ ...current, stateCode, cityName: "" }));
    try {
      const { data } = await api.get("/prospeccao/localidades/cidades", {
        params: { pais: form.countryCode, estado: stateCode || undefined }
      });
      setCities(data || []);
    } catch (error) {
      toastError(error);
    }
  };

  const toggleAutomation = async event => {
    event.stopPropagation();
    try {
      const { data } = await api.patch("/prospeccao/automacao/ativacao", {
        enabled: !automation.enabled
      });
      setAutomation(data);
    } catch (error) {
      toastError(error);
      if (!automation.enabled) setAutomationOpen(true);
    }
  };

  useEffect(() => {
    const carregaProdutos = async () => {
      try {
        const { data } = await api.get("/prospeccao/produtos");
        if (!montado.current) return;
        const lista = Array.isArray(data) ? data : [];
        setProdutos(lista);
        setForm(atual => ({
          ...atual,
          produto:
            atual.produto ||
            (lista.includes("espaco-whats") ? "espaco-whats" : lista[0] || "")
        }));
      } catch (err) {
        toastError(err);
      }
    };
    carregaProdutos();
  }, []);

  const carregaLeads = useCallback(async () => {
    setCarregandoLista(true);
    try {
      const { data } = await api.get("/prospeccao/leads", {
        params: {
          filtro,
          searchParam: buscaAplicada,
          pageNumber: pagina + 1,
          perPage: porPagina
        }
      });
      if (!montado.current) return;
      setLeads(data.leads || []);
      setTotal(data.count || 0);
      // Rascunho editado na tela vence o que veio do servidor: uma atualização
      // de lista não pode apagar o que a pessoa acabou de escrever.
      setRascunhos(atual => {
        const proximo = { ...atual };
        (data.leads || []).forEach(lead => {
          if (proximo[lead.id] === undefined && lead.rascunho) {
            proximo[lead.id] = lead.rascunho;
          }
        });
        return proximo;
      });
    } catch (err) {
      if (montado.current) toastError(err);
    } finally {
      if (montado.current) setCarregandoLista(false);
    }
  }, [filtro, buscaAplicada, pagina, porPagina]);

  useEffect(() => {
    carregaLeads();
  }, [carregaLeads]);

  const consulta = useCallback(
    async idDoJob => {
      try {
        const { data } = await api.get(`/prospeccao/buscas/${idDoJob}`);
        if (!montado.current || jobAcompanhado.current !== idDoJob) return;

        setProgresso(data);
        // O poll ingere os leads novos na base; a lista recarrega para mostrar
        // os rascunhos conforme vão ficando prontos.
        carregaLeads();

        if (data.raspagemTerminou && !raspagemTerminouEm.current) {
          raspagemTerminouEm.current = Date.now();
        }

        if (data.statusBusca === "failed" || data.statusBusca === "timeout") {
          setAcompanhando(false);
          setAviso(
            data.statusBusca === "timeout"
              ? "A raspagem do Google Maps estourou o tempo limite. Tente de novo com menos resultados."
              : "A raspagem do Google Maps falhou. Tente de novo em alguns minutos."
          );
          return;
        }

        if (data.concluido) {
          setAcompanhando(false);
          setAviso(
            data.repetidos > 0
              ? `Busca concluída: ${data.novos} lead(s) novo(s). ${data.repetidos} já estavam na sua base e foram ignorados.`
              : ""
          );
          return;
        }

        if (Date.now() - inicioDoJob.current > LIMITE_TOTAL_MS) {
          setAcompanhando(false);
          setAviso(
            (data.total || 0) === 0
              ? "A busca ainda não devolveu nenhum lead. O enriquecimento pode estar lento — clique em Atualizar daqui a alguns minutos antes de tentar outro nicho ou cidade."
              : "A geração dos rascunhos está demorando mais que o normal. Os leads prontos já aparecem abaixo — use Atualizar para buscar o resto."
          );
          return;
        }

        temporizador.current = setTimeout(
          () => consulta(idDoJob),
          INTERVALO_POLL_MS
        );
      } catch (err) {
        if (!montado.current || jobAcompanhado.current !== idDoJob) return;
        setAcompanhando(false);
        toastError(err);
      }
    },
    [carregaLeads]
  );

  const acompanha = useCallback(
    idDoJob => {
      if (temporizador.current) clearTimeout(temporizador.current);
      jobAcompanhado.current = idDoJob;
      setAcompanhando(true);
      setAviso("");
      consulta(idDoJob);
    },
    [consulta]
  );

  // Buscar leads leva minutos: se a pessoa recarregar a tela no meio, ela volta
  // acompanhando a mesma busca em vez de perder o acompanhamento.
  const restaurou = useRef(false);
  useEffect(() => {
    if (restaurou.current) return;
    restaurou.current = true;
    const salvo = localStorage.getItem(CHAVE_ULTIMO_JOB);
    if (!salvo) return;
    setJobId(salvo);
    inicioDoJob.current = Date.now();
    raspagemTerminouEm.current = null;
    acompanha(salvo);
  }, [acompanha]);

  const alteraCampo = campo => event => {
    const valor =
      campo === "somenteComWhatsapp"
        ? event.target.checked
        : event.target.value;
    setForm(atual => ({ ...atual, [campo]: valor }));
  };

  const inicia = async event => {
    event.preventDefault();
    if (!form.nicho.trim() || !form.countryCode || !form.produto) return;

    setIniciando(true);
    try {
      const { data } = await api.post("/prospeccao/buscas", {
        nicho: form.nicho.trim(),
        countryCode: form.countryCode,
        stateCode: form.stateCode || undefined,
        cityName: form.cityName || undefined,
        maxResultados: Number(form.maxResultados) || 10,
        tom: form.tom,
        produto: form.produto,
        somenteComWhatsapp: form.somenteComWhatsapp
      });

      if (temporizador.current) clearTimeout(temporizador.current);
      setProgresso(null);
      setJobId(data.jobId);
      localStorage.setItem(CHAVE_ULTIMO_JOB, data.jobId);
      inicioDoJob.current = Date.now();
      raspagemTerminouEm.current = null;
      acompanha(data.jobId);
    } catch (err) {
      toastError(err);
    } finally {
      setIniciando(false);
    }
  };

  const copia = async texto => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Rascunho copiado");
    } catch (err) {
      toast.error("Não consegui copiar o rascunho");
    }
  };

  const alteraRascunho = (id, texto) =>
    setRascunhos(atual => ({ ...atual, [id]: texto }));

  const abreConversa = async lead => {
    const texto = rascunhos[lead.id] ?? lead.rascunho ?? "";
    setAbrindo(lead.id);
    try {
      const { data } = await api.post(`/prospeccao/leads/${lead.id}/conversa`, {
        rascunho: texto
      });
      // O MessageInput lê o rascunho do sessionStorage pela chave do ticket:
      // é assim que a conversa abre com a mensagem já escrita, sem enviar.
      if (texto.trim()) {
        sessionStorage.setItem(`messageDraft-${data.ticketId}`, texto.trim());
      }
      history.push(`/tickets/${data.ticketUuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (montado.current) setAbrindo(null);
    }
  };

  // Depois que o poll desiste (ou quando a pessoa volta na tela horas depois),
  // Atualizar é o jeito de buscar o que ficou pronto no meio tempo.
  const atualiza = () => {
    carregaLeads();
    api
      .get("/prospeccao/automacao")
      .then(({ data }) => setAutomation(data || { enabled: false }))
      .catch(toastError);
    if (!jobId) return;
    inicioDoJob.current = Date.now();
    raspagemTerminouEm.current = null;
    acompanha(jobId);
  };

  const aplicaBusca = event => {
    event.preventDefault();
    setPagina(0);
    setBuscaAplicada(busca.trim());
  };

  const podeBuscar =
    !iniciando && !!form.nicho.trim() && !!form.countryCode && !!form.produto;
  const automationProgress = automation.progress || {};
  const automationExecutions = automationProgress.executions || [];
  const sendPercent = automationProgress.dailyLimit
    ? Math.min(
        100,
        (100 * (automationProgress.sentToday || 0)) /
          automationProgress.dailyLimit
      )
    : 0;

  const mensagemDeEtapa = () => {
    if (!progresso) return "Enviando a busca...";
    if (!progresso.raspagemTerminou) {
      return "Raspando o Google Maps. Isso costuma levar de 1 a 3 minutos.";
    }
    if ((progresso.total || 0) === 0) {
      // A espera aqui passa de cinco minutos sem nada na tela mudar; dizer há
      // quanto tempo é o que diferencia "está trabalhando" de "travou".
      const minutos = raspagemTerminouEm.current
        ? Math.floor((Date.now() - raspagemTerminouEm.current) / 60000)
        : 0;
      return `Raspagem concluída. Enriquecendo os leads pelo Instagram — costuma levar de 3 a 6 minutos${
        minutos >= 1 ? ` (${minutos} min até agora)` : ""
      }.`;
    }
    if (progresso.pendentes > 0) {
      return `Escrevendo os rascunhos: ${
        progresso.total - progresso.pendentes
      } de ${progresso.total} prontos.`;
    }
    return "Finalizando...";
  };

  return (
    <MainContainer className="sd-business sd-prospecting">
      <MainHeader>
        <Title>Prospecção</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="outlined"
            color="primary"
            disabled={acompanhando || carregandoLista}
            startIcon={<RefreshIcon />}
            onClick={atualiza}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => setAutomationOpen(true)}
          >
            Envio automático
            {automation.enabled && automationProgress.dailyLimit
              ? ` • ${automationProgress.sentToday || 0}/${
                  automationProgress.dailyLimit
                }`
              : ""}
            <Switch
              size="small"
              color="primary"
              checked={!!automation.enabled}
              onClick={toggleAutomation}
            />
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.painel} variant="outlined">
        <Paper
          className={`${classes.formulario} sd-search-quest`}
          variant="outlined"
        >
          <form onSubmit={inicia}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Nicho"
                  placeholder="hamburgueria"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={form.nicho}
                  onChange={alteraCampo("nicho")}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>País</InputLabel>
                  <Select
                    label="País"
                    value={form.countryCode}
                    onChange={changeCountry}
                  >
                    {countries.map(item => (
                      <MenuItem key={item.code} value={item.code}>
                        {countryLabel(item)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Estado (opcional)</InputLabel>
                  <Select
                    label="Estado (opcional)"
                    value={form.stateCode}
                    onChange={changeState}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {states.map(item => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Cidade (opcional)</InputLabel>
                  <Select
                    label="Cidade (opcional)"
                    value={form.cityName}
                    onChange={alteraCampo("cityName")}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {cities.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4} md={1}>
                <TextField
                  label="Quantos leads"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 1, max: 50 }}
                  value={form.maxResultados}
                  onChange={alteraCampo("maxResultados")}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={1}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel id="prospeccao-produto">Produto</InputLabel>
                  <Select
                    labelId="prospeccao-produto"
                    label="Produto"
                    value={form.produto}
                    onChange={alteraCampo("produto")}
                  >
                    {produtos.map(produto => (
                      <MenuItem key={produto} value={produto}>
                        {rotuloProduto(produto)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel id="prospeccao-tom">Tom</InputLabel>
                  <Select
                    labelId="prospeccao-tom"
                    label="Tom"
                    value={form.tom}
                    onChange={alteraCampo("tom")}
                  >
                    {TONS.map(tom => (
                      <MenuItem key={tom.value} value={tom.value}>
                        {tom.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <div className={classes.acoesFormulario}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!podeBuscar}
                    startIcon={
                      iniciando ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SearchIcon />
                      )
                    }
                  >
                    Buscar leads
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={form.somenteComWhatsapp}
                        onChange={alteraCampo("somenteComWhatsapp")}
                      />
                    }
                    label="Só quem tem WhatsApp"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Leads que já estão na sua base são ignorados
                    automaticamente.
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {(acompanhando || aviso) && (
          <Paper
            className={`${classes.progresso} sd-quest-progress`}
            variant="outlined"
          >
            <Typography variant="body2">
              {acompanhando ? mensagemDeEtapa() : aviso}
            </Typography>
            {acompanhando && <LinearProgress className={classes.barra} />}
          </Paper>
        )}

        {(automation.enabled || automationExecutions.length > 0) && (
          <Paper
            className={`${classes.progresso} sd-quest-progress`}
            variant="outlined"
          >
            <div className={classes.automationHeader}>
              <Typography variant="subtitle2">
                {automation.enabled
                  ? "Envio automático ativo"
                  : "Envio automático pausado"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Atualização automática a cada 10 segundos
              </Typography>
            </div>
            <Grid container spacing={2}>
              <Grid
                item
                xs={6}
                sm={3}
                className={`${classes.automationMetric} sd-quest-metric`}
              >
                <Typography variant="caption" color="textSecondary">
                  Buscas hoje
                </Typography>
                <Typography variant="h6">
                  {automationProgress.searchesCompleted || 0}/
                  {automationProgress.searchesTotal || 0}
                </Typography>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                className={`${classes.automationMetric} sd-quest-metric`}
              >
                <Typography variant="caption" color="textSecondary">
                  Resultados encontrados
                </Typography>
                <Typography variant="h6">
                  {automationProgress.foundLeads || 0}/
                  {automationProgress.targetLeads || 0}
                </Typography>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                className={`${classes.automationMetric} sd-quest-metric`}
              >
                <Typography variant="caption" color="textSecondary">
                  Leads elegíveis na fila
                </Typography>
                <Typography variant="h6">
                  {(automationProgress.queued || 0) +
                    (automationProgress.sending || 0)}
                </Typography>
              </Grid>
              <Grid
                item
                xs={6}
                sm={3}
                className={`${classes.automationMetric} sd-quest-metric`}
              >
                <Typography variant="caption" color="textSecondary">
                  Envios hoje
                </Typography>
                <Typography variant="h6">
                  {automationProgress.sentToday || 0}/
                  {automationProgress.dailyLimit || automation.dailyLimit || 0}
                </Typography>
              </Grid>
            </Grid>
            <LinearProgress
              className={classes.barra}
              variant="determinate"
              value={sendPercent}
            />
            <Typography variant="body2" color="textSecondary">
              {automationProgress.sending > 0
                ? "Enviando uma mensagem agora."
                : automationProgress.nextSendAt
                  ? `Próximo envio previsto para ${horaLocal(
                      automationProgress.nextSendAt
                    )}.`
                  : automationProgress.searchesActive > 0
                    ? "As buscas ainda estão preparando os próximos envios."
                    : automation.enabled
                      ? "Aguardando o próximo horário configurado."
                      : "Os envios pendentes estão pausados."}
              {automationProgress.repliedToday > 0
                ? ` ${automationProgress.repliedToday} cliente(s) responderam hoje.`
                : ""}
              {automationProgress.retrying > 0
                ? ` ${automationProgress.retrying} envio(s) aguardam nova tentativa após uma falha temporária.`
                : ""}
              {automationProgress.failed > 0
                ? ` ${automationProgress.failed} envio(s) falharam após três tentativas.`
                : ""}
            </Typography>
            {automationExecutions.length > 0 && (
              <div className={classes.automationExecutions}>
                {automationExecutions.map(item => (
                  <div
                    className={`${classes.automationExecution} sd-quest-execution`}
                    key={item.id}
                  >
                    <Typography variant="body2">
                      {item.time || "--:--"} · {item.nicho || "Agenda alterada"}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {AUTOMATION_STATUS[item.status] || item.status} ·{" "}
                      {item.totalLeads || 0}/{item.maxResults || 0} encontrados
                      · {item.eligibleLeads || 0} elegíveis
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </Paper>
        )}

        <Paper className={classes.filtros} variant="outlined">
          <FormControl variant="outlined" size="small">
            <InputLabel id="prospeccao-filtro">Mostrar</InputLabel>
            <Select
              labelId="prospeccao-filtro"
              label="Mostrar"
              value={filtro}
              onChange={event => {
                setPagina(0);
                setFiltro(event.target.value);
              }}
              style={{ minWidth: 200 }}
            >
              {FILTROS.map(opcao => (
                <MenuItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <form onSubmit={aplicaBusca}>
            <TextField
              label="Buscar por nome, categoria ou @"
              variant="outlined"
              size="small"
              value={busca}
              onChange={event => setBusca(event.target.value)}
              onBlur={aplicaBusca}
              style={{ minWidth: 260 }}
            />
          </form>

          <TablePagination
            component="div"
            count={total}
            page={pagina}
            onChangePage={(_evento, novaPagina) => setPagina(novaPagina)}
            rowsPerPage={porPagina}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onChangeRowsPerPage={evento => {
              setPorPagina(Number(evento.target.value));
              setPagina(0);
            }}
            labelRowsPerPage="Leads por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </Paper>

        {carregandoLista && leads.length === 0 && (
          <div className={`${classes.vazio} sd-quest-empty`}>
            <CircularProgress size={24} />
          </div>
        )}

        {leads.map(lead => (
          <CardLead
            key={lead.id}
            lead={lead}
            rascunho={rascunhos[lead.id] ?? lead.rascunho ?? ""}
            abrindo={abrindo === lead.id}
            onRascunhoChange={alteraRascunho}
            onAbrirConversa={abreConversa}
            onCopiar={copia}
          />
        ))}

        {!carregandoLista && leads.length === 0 && (
          <div className={`${classes.vazio} sd-quest-empty`}>
            <Typography variant="body1">
              {total === 0 && filtro === "todos" && !buscaAplicada
                ? "Nenhum lead ainda. Escolha um nicho e uma cidade para buscar no Google Maps."
                : "Nenhum lead com esse filtro."}
            </Typography>
            {total === 0 && filtro === "todos" && !buscaAplicada && (
              <Typography variant="body2">
                O sistema enriquece cada lead pelo Instagram e escreve um
                rascunho pronto para mandar no WhatsApp.
              </Typography>
            )}
          </div>
        )}
      </Paper>
      <AutomationDialog
        open={automationOpen}
        onClose={() => setAutomationOpen(false)}
        products={produtos}
        onSaved={setAutomation}
      />
    </MainContainer>
  );
};

const Prospeccao = () => {
  const { user } = useContext(AuthContext);
  if (!podeVerProspeccao(user)) return <Redirect to="/" />;
  return <ProspeccaoContent />;
};

export default Prospeccao;
