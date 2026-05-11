import React, { useState, useEffect, useReducer } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import { toast } from "react-toastify";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import SubscriptionModal from "../../components/SubscriptionModal";
import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import toastError from "../../errors/toastError";

import moment from "moment";

const reducer = (state, action) => {
  if (action.type === "LOAD_INVOICES") {
    const invoices = action.payload;
    const newUsers = [];

    invoices.forEach(user => {
      const userIndex = state.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  fiscalPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  }
}));

const Invoices = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam] = useState("");
  const [invoices, dispatch] = useReducer(reducer, []);
  const [storagePlans, setStoragePlans] = React.useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const [fiscal, setFiscal] = useState({
    name: "", document: "", postalCode: "", address: "",
    city: "", state: "", municipalRegistration: "", stateRegistration: "", fiscalEmail: ""
  });
  const [fiscalLoading, setFiscalLoading] = useState(false);

  const handleOpenContactModal = invoices => {
    setStoragePlans(invoices);
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  useEffect(() => {
    api.get("/companies/fiscal/me").then(({ data }) => {
      setFiscal({
        name: data.name || "",
        document: data.document || "",
        postalCode: data.postalCode || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        municipalRegistration: data.municipalRegistration || "",
        stateRegistration: data.stateRegistration || "",
        fiscalEmail: data.fiscalEmail || ""
      });
    }).catch(() => {});
  }, []);

  const handleCepBlur = async () => {
    const cep = fiscal.postalCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const { data } = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r => r.json());
      if (!data.erro) {
        setFiscal(prev => ({
          ...prev,
          address: `${data.logradouro}${data.bairro ? ", " + data.bairro : ""}`,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (_) {}
  };

  const handleSaveFiscal = async () => {
    setFiscalLoading(true);
    try {
      await api.put("/companies/fiscal/me", fiscal);
      toast.success("Dados fiscais salvos com sucesso.");
    } catch (err) {
      toastError(err);
    }
    setFiscalLoading(false);
  };

  const handleEmitNfse = async invoice => {
    try {
      const { data } = await api.post(`/invoices/${invoice.id}/nfse`);
      dispatch({ type: "UPDATE_USERS", payload: data });
      if (data.nfseUrl) {
        window.open(data.nfseUrl, "_blank");
      } else {
        toast.success("Nota fiscal emitida! Aguarde o processamento.");
      }
    } catch (err) {
      toastError(err);
    }
  };
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchInvoices = async () => {
        try {
          const { data } = await api.get("/invoices/all", {
            params: { searchParam, pageNumber }
          });
          dispatch({ type: "LOAD_INVOICES", payload: data });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchInvoices();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const loadMore = () => {
    setPageNumber(prevState => prevState + 1);
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };
  const rowStyle = record => {
    const hoje = moment(moment()).format("DD/MM/yyyy");
    const vencimento = moment(record.dueDate).format("DD/MM/yyyy");
    var diff = moment(vencimento, "DD/MM/yyyy").diff(
      moment(hoje, "DD/MM/yyyy")
    );
    var dias = moment.duration(diff).asDays();
    if (dias < 0 && record.status !== "paid") {
      return { backgroundColor: "#ffbcbc9c" };
    }
  };

  const rowStatus = record => {
    const hoje = moment(moment()).format("DD/MM/yyyy");
    const vencimento = moment(record.dueDate).format("DD/MM/yyyy");
    var diff = moment(vencimento, "DD/MM/yyyy").diff(
      moment(hoje, "DD/MM/yyyy")
    );
    var dias = moment.duration(diff).asDays();
    const status = record.status;
    if (status === "paid") {
      return "Pago";
    }
    if (dias < 0) {
      return "Vencido";
    } else {
      return "Em Aberto";
    }
  };

  return (
    <MainContainer>
      <SubscriptionModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        Invoice={storagePlans}
        contactId={selectedContactId}
      ></SubscriptionModal>
      <MainHeader>
        <Title>Faturas</Title>
      </MainHeader>

      <Paper className={classes.fiscalPaper} variant="outlined">
        <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 12 }}>
          Dados para Nota Fiscal
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nome / Razão Social" value={fiscal.name}
              onChange={e => setFiscal(p => ({ ...p, name: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="CPF / CNPJ" value={fiscal.document}
              onChange={e => setFiscal(p => ({ ...p, document: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="CEP" value={fiscal.postalCode}
              onChange={e => setFiscal(p => ({ ...p, postalCode: e.target.value }))}
              onBlur={handleCepBlur} />
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField fullWidth label="Endereço (Rua, Número, Bairro)" value={fiscal.address}
              onChange={e => setFiscal(p => ({ ...p, address: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField fullWidth label="Cidade" value={fiscal.city}
              onChange={e => setFiscal(p => ({ ...p, city: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth label="UF" value={fiscal.state}
              onChange={e => setFiscal(p => ({ ...p, state: e.target.value }))}
              inputProps={{ maxLength: 2 }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Inscrição Municipal (opcional)" value={fiscal.municipalRegistration}
              onChange={e => setFiscal(p => ({ ...p, municipalRegistration: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Inscrição Estadual (opcional)" value={fiscal.stateRegistration}
              onChange={e => setFiscal(p => ({ ...p, stateRegistration: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="E-mail para NF (opcional)" value={fiscal.fiscalEmail}
              onChange={e => setFiscal(p => ({ ...p, fiscalEmail: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSaveFiscal} disabled={fiscalLoading}>
              Salvar Dados Fiscais
            </Button>
          </Grid>
        </Grid>
        <Divider style={{ marginTop: 16 }} />
      </Paper>

      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Id</TableCell>
              <TableCell align="center">Detalhes</TableCell>
              <TableCell align="center">Valor</TableCell>
              <TableCell align="center">Data Venc.</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {invoices.map(invoices => (
                <TableRow style={rowStyle(invoices)} key={invoices.id}>
                  <TableCell align="center">{invoices.id}</TableCell>
                  <TableCell align="center">{invoices.detail}</TableCell>
                  <TableCell style={{ fontWeight: "bold" }} align="center">
                    {safeValueFormat(invoices.value, invoices.currency)}
                  </TableCell>
                  <TableCell align="center">
                    {moment(invoices.dueDate)
                      .locale(navigator.language)
                      .format("L")}
                  </TableCell>
                  <TableCell style={{ fontWeight: "bold" }} align="center">
                    {rowStatus(invoices)}
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                      {rowStatus(invoices) !== "Pago" ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleOpenContactModal(invoices)}
                          >
                            PAGAR
                          </Button>
                          {invoices.paymentMethod === "boleto" && invoices.boletoUrl && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(invoices.boletoUrl, "_blank")}
                            >
                              VER BOLETO
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button size="small" variant="outlined">
                            PAGO
                          </Button>
                          {invoices.paymentMethod === "boleto" && invoices.boletoUrl && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(invoices.boletoUrl, "_blank")}
                            >
                              VER BOLETO
                            </Button>
                          )}
                          {invoices.nfseUrl ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => window.open(invoices.nfseUrl, "_blank")}
                            >
                              VER NOTA
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleEmitNfse(invoices)}
                            >
                              EMITIR NOTA
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Invoices;
