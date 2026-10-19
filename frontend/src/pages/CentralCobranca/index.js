import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import RefreshIcon from "@material-ui/icons/Refresh";
import AddIcon from "@material-ui/icons/Add";
import ReceiptIcon from "@material-ui/icons/Receipt";
import EditIcon from "@material-ui/icons/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import api from "../../services/api";
import toastError from "../../errors/toastError";

import CartaoResumo from "./CartaoResumo";
import ModalCliente from "./ModalCliente";
import ModalCobranca from "./ModalCobranca";
import ModalLancarCobranca from "./ModalLancarCobranca";
import {
  fimDoMes,
  formatCurrency,
  formatDate,
  inicioDoMes,
  metodoLabel,
  situacaoColor,
  situacaoLabel
} from "./format";

const useStyles = makeStyles(theme => ({
  painel: {
    flex: 1,
    overflowY: "auto",
    padding: theme.spacing(1),
    ...theme.scrollbarStyles
  },
  filtros: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1)
  },
  cards: {
    marginBottom: theme.spacing(1)
  },
  grafico: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    height: 260
  },
  tabela: {
    marginTop: theme.spacing(1)
  },
  clienteNome: {
    fontWeight: 600
  }
}));

const FILTROS_SITUACAO = [
  { value: "", label: "Todas" },
  { value: "open", label: "Em aberto" },
  { value: "overdue", label: "Vencidas" },
  { value: "paid", label: "Pagas" },
  { value: "cancelled", label: "Canceladas" }
];

const CentralCobranca = () => {
  const classes = useStyles();
  const theme = useTheme();

  const [aba, setAba] = useState(0);
  const [filtros, setFiltros] = useState({
    startDate: inicioDoMes(),
    endDate: fimDoMes(),
    status: "",
    planId: "",
    companyId: "",
    searchParam: ""
  });
  const [busca, setBusca] = useState("");

  const [overview, setOverview] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [gateway, setGateway] = useState({ configured: false });

  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [carregandoFaturas, setCarregandoFaturas] = useState(true);
  const [carregandoClientes, setCarregandoClientes] = useState(true);

  const [faturaAberta, setFaturaAberta] = useState(null);
  const [clienteAberto, setClienteAberto] = useState(null);
  const [lancando, setLancando] = useState(false);

  const params = useMemo(
    () =>
      Object.entries(filtros).reduce((acc, [chave, valor]) => {
        if (valor !== "" && valor !== null && valor !== undefined) {
          acc[chave] = valor;
        }
        return acc;
      }, {}),
    [filtros]
  );

  const carregarResumo = useCallback(async () => {
    setCarregandoResumo(true);
    try {
      const { data } = await api.get("/billing-admin/overview", { params });
      setOverview(data);
    } catch (err) {
      toastError(err);
    }
    setCarregandoResumo(false);
  }, [params]);

  const carregarFaturas = useCallback(async () => {
    setCarregandoFaturas(true);
    try {
      const { data } = await api.get("/billing-admin/invoices", {
        params: { ...params, perPage: 200 }
      });
      setFaturas(data.invoices);
    } catch (err) {
      toastError(err);
    }
    setCarregandoFaturas(false);
  }, [params]);

  const carregarClientes = useCallback(async () => {
    setCarregandoClientes(true);
    try {
      const { data } = await api.get("/billing-admin/clients", {
        params: {
          planId: filtros.planId || undefined,
          searchParam: filtros.searchParam || undefined
        }
      });
      setClientes(data);
    } catch (err) {
      toastError(err);
    }
    setCarregandoClientes(false);
  }, [filtros.planId, filtros.searchParam]);

  useEffect(() => {
    const carregarFixos = async () => {
      try {
        const [{ data: listaPlanos }, { data: infoGateway }] =
          await Promise.all([
            api.get("/billing-admin/plans"),
            api.get("/billing-admin/gateway")
          ]);
        setPlanos(listaPlanos);
        setGateway(infoGateway);
      } catch (err) {
        toastError(err);
      }
    };
    carregarFixos();
  }, []);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  useEffect(() => {
    carregarFaturas();
  }, [carregarFaturas]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // A busca por texto é debounced pra não disparar três requisições por tecla.
  useEffect(() => {
    const timer = setTimeout(
      () => setFiltros(atual => ({ ...atual, searchParam: busca })),
      450
    );
    return () => clearTimeout(timer);
  }, [busca]);

  const setFiltro = (campo, valor) =>
    setFiltros(atual => ({ ...atual, [campo]: valor }));

  const limparFiltros = () => {
    setBusca("");
    setFiltros({
      startDate: inicioDoMes(),
      endDate: fimDoMes(),
      status: "",
      planId: "",
      companyId: "",
      searchParam: ""
    });
  };

  const recarregarTudo = () => {
    carregarResumo();
    carregarFaturas();
    carregarClientes();
  };

  const aplicarFatura = atualizada => {
    setFaturas(atual =>
      atual.map(item =>
        item.id === atualizada.id ? { ...item, ...atualizada } : item
      )
    );
    carregarResumo();
  };

  const totais = overview?.totals;

  const dadosGrafico = (overview?.byMonth || []).map(item => ({
    mes: item.label,
    Recebido: item.received,
    "Em aberto": item.open,
    Vencido: item.overdue
  }));

  const cards = [
    {
      titulo: "Faturado no período",
      valor: formatCurrency(totais?.billed),
      detalhe: `${totais?.count || 0} cobrança(s)`,
      cor: theme.palette.primary.main
    },
    {
      titulo: "Recebido",
      valor: formatCurrency(totais?.received),
      detalhe: `${totais?.paidCount || 0} paga(s)`,
      cor: "#27ae60"
    },
    {
      titulo: "Em aberto",
      valor: formatCurrency(totais?.open),
      detalhe: `${totais?.openCount || 0} a vencer`,
      cor: "#2f80ed"
    },
    {
      titulo: "Vencido",
      valor: formatCurrency(totais?.overdue),
      detalhe: `${totais?.overdueCount || 0} em atraso`,
      cor: "#eb5757"
    },
    {
      titulo: "Receita recorrente (MRR)",
      valor: formatCurrency(overview?.mrr),
      detalhe: `${overview?.clients?.active || 0} cliente(s) ativo(s)`,
      cor: "#9b51e0"
    },
    {
      titulo: "Em teste grátis",
      valor: String(overview?.clients?.trial || 0),
      detalhe: `${overview?.clients?.total || 0} cliente(s) na carteira`,
      cor: "#f2994a"
    }
  ];

  return (
    <MainContainer className="sd-business sd-billing">
      <ModalLancarCobranca
        aberto={lancando}
        aoFechar={() => setLancando(false)}
        clientes={clientes}
        gatewayPronto={!!gateway.configured}
        aoLancar={() => recarregarTudo()}
      />
      <ModalCobranca
        invoiceId={faturaAberta}
        aberto={!!faturaAberta}
        aoFechar={() => setFaturaAberta(null)}
        gatewayPronto={!!gateway.configured}
        aoAtualizar={aplicarFatura}
        aoExcluir={() => recarregarTudo()}
      />
      <ModalCliente
        cliente={clienteAberto}
        aberto={!!clienteAberto}
        aoFechar={() => setClienteAberto(null)}
        planos={planos}
        aoSalvar={() => recarregarTudo()}
      />

      <MainHeader>
        <Title>Central de Cobrança</Title>
        <MainHeaderButtonsWrapper>
          <Tooltip title="Atualizar">
            <IconButton onClick={recarregarTudo}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setLancando(true)}
          >
            Lançar cobrança
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.painel} variant="outlined">
        {!gateway.configured && (
          <Box mb={1}>
            <Typography variant="caption" color="error">
              AbacatePay não configurado nesta instalação: dá pra lançar e dar
              baixa manual, mas não gerar link de pagamento. Configure em
              Configurações → Gateway de pagamento.
            </Typography>
          </Box>
        )}

        <Paper
          className={`${classes.filtros} sd-ledger-filters`}
          variant="outlined"
        >
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                variant="outlined"
                label="Vencimento de"
                InputLabelProps={{ shrink: true }}
                value={filtros.startDate}
                onChange={e => setFiltro("startDate", e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                variant="outlined"
                label="até"
                InputLabelProps={{ shrink: true }}
                value={filtros.endDate}
                onChange={e => setFiltro("endDate", e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="filtro-situacao">Situação</InputLabel>
                <Select
                  labelId="filtro-situacao"
                  label="Situação"
                  value={filtros.status}
                  onChange={e => setFiltro("status", e.target.value)}
                >
                  {FILTROS_SITUACAO.map(item => (
                    <MenuItem key={item.value || "todas"} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="filtro-plano">Plano</InputLabel>
                <Select
                  labelId="filtro-plano"
                  label="Plano"
                  value={filtros.planId}
                  onChange={e => setFiltro("planId", e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {planos.map(plano => (
                    <MenuItem key={plano.id} value={plano.id}>
                      {plano.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Cliente"
                placeholder="nome, e-mail ou telefone"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button fullWidth variant="outlined" onClick={limparFiltros}>
                Limpar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={1} className={classes.cards}>
          {cards.map(card => (
            <Grid item xs={6} sm={4} md={2} key={card.titulo}>
              <CartaoResumo
                titulo={card.titulo}
                valor={card.valor}
                detalhe={card.detalhe}
                cor={card.cor}
                carregando={carregandoResumo && !overview}
              />
            </Grid>
          ))}
        </Grid>

        {dadosGrafico.length > 0 && (
          <Paper
            className={`${classes.grafico} sd-ledger-chart`}
            variant="outlined"
          >
            <Typography variant="caption" color="textSecondary">
              Cobranças por mês de vencimento
            </Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip formatter={valor => formatCurrency(valor)} />
                <Legend />
                <Bar
                  dataKey="Recebido"
                  stackId="a"
                  fill={theme.isStardew ? "#477b38" : "#27ae60"}
                />
                <Bar
                  dataKey="Em aberto"
                  stackId="a"
                  fill={theme.isStardew ? "#ca9939" : "#2f80ed"}
                />
                <Bar
                  dataKey="Vencido"
                  stackId="a"
                  fill={theme.isStardew ? "#a94735" : "#eb5757"}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        <Tabs
          value={aba}
          onChange={(_e, valor) => setAba(valor)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Cobranças (${faturas.length})`} />
          <Tab label={`Clientes (${clientes.length})`} />
          <Tab label="Por plano" />
        </Tabs>

        {aba === 0 && (
          <Table size="small" className={classes.tabela}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="center">Vencimento</TableCell>
                <TableCell align="center">Situação</TableCell>
                <TableCell align="center">Forma</TableCell>
                <TableCell align="center">Pago em</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregandoFaturas && <TableRowSkeleton columns={10} />}
              {!carregandoFaturas && faturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Nenhuma cobrança no período selecionado.
                  </TableCell>
                </TableRow>
              )}
              {!carregandoFaturas &&
                faturas.map(fatura => (
                  <TableRow key={fatura.id} hover>
                    <TableCell>{fatura.id}</TableCell>
                    <TableCell className={classes.clienteNome}>
                      {fatura.company?.name || "-"}
                    </TableCell>
                    <TableCell>{fatura.company?.planName || "-"}</TableCell>
                    <TableCell>
                      {fatura.detail}
                      {fatura.billingType === "initial_prorata" && (
                        <Chip
                          size="small"
                          label="pró-rata"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                      {fatura.origem === "manual" && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="manual"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(fatura.value, fatura.currency)}
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(fatura.dueDate)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={situacaoLabel(fatura.situacao)}
                        style={{
                          backgroundColor: situacaoColor(fatura.situacao),
                          color: "#fff"
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {metodoLabel(fatura.forma)}
                    </TableCell>
                    <TableCell align="center">
                      {fatura.paidAt ? formatDate(fatura.paidAt) : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Abrir cobrança">
                        <IconButton
                          size="small"
                          onClick={() => setFaturaAberta(fatura.id)}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {aba === 1 && (
          <Table size="small" className={classes.tabela}>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell align="right">Mensalidade</TableCell>
                <TableCell align="center">Vencimento</TableCell>
                <TableCell align="center">Situação</TableCell>
                <TableCell align="right">Em aberto</TableCell>
                <TableCell align="right">Vencido</TableCell>
                <TableCell align="center">Último pagamento</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregandoClientes && <TableRowSkeleton columns={9} />}
              {!carregandoClientes && clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
              {!carregandoClientes &&
                clientes.map(cliente => (
                  <TableRow key={cliente.id} hover>
                    <TableCell className={classes.clienteNome}>
                      {cliente.name}
                      <Typography variant="caption" display="block">
                        {cliente.phone || cliente.email || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>{cliente.planName || "-"}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(cliente.monthlyValue, cliente.currency)}
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(cliente.dueDate)}
                      <Typography variant="caption" display="block">
                        {cliente.recurrence || "MENSAL"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {!cliente.status ? (
                        <Chip size="small" label="Inativo" />
                      ) : cliente.inTrial ? (
                        <Chip
                          size="small"
                          label={`Teste até ${formatDate(cliente.trialEndsAt)}`}
                          style={{ backgroundColor: "#f2994a", color: "#fff" }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Ativo"
                          style={{ backgroundColor: "#27ae60", color: "#fff" }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(cliente.openAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{
                        color:
                          cliente.overdueAmount > 0 ? "#eb5757" : undefined,
                        fontWeight: cliente.overdueAmount > 0 ? 700 : undefined
                      }}
                    >
                      {formatCurrency(cliente.overdueAmount)}
                    </TableCell>
                    <TableCell align="center">
                      {cliente.lastPaidAt
                        ? moment(cliente.lastPaidAt).format("DD/MM/YYYY")
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Plano, mensalidade e teste">
                        <IconButton
                          size="small"
                          onClick={() => setClienteAberto(cliente)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {aba === 2 && (
          <Table size="small" className={classes.tabela}>
            <TableHead>
              <TableRow>
                <TableCell>Plano</TableCell>
                <TableCell align="center">Clientes ativos</TableCell>
                <TableCell align="right">MRR</TableCell>
                <TableCell align="right">Faturado</TableCell>
                <TableCell align="right">Recebido</TableCell>
                <TableCell align="right">Em aberto</TableCell>
                <TableCell align="right">Vencido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregandoResumo && <TableRowSkeleton columns={7} />}
              {!carregandoResumo && (overview?.byPlan || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Sem dados no período.
                  </TableCell>
                </TableRow>
              )}
              {!carregandoResumo &&
                (overview?.byPlan || []).map(linha => (
                  <TableRow key={`${linha.planId}-${linha.planName}`}>
                    <TableCell>{linha.planName}</TableCell>
                    <TableCell align="center">{linha.clients}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(linha.mrr)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(linha.billed)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(linha.received)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(linha.open)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(linha.overdue)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </MainContainer>
  );
};

export default CentralCobranca;
