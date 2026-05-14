import React, { useState, useEffect, useReducer } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
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
import { i18n } from "../../translate/i18n";

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

  const handleOpenContactModal = invoices => {
    setStoragePlans(invoices);
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCheckPayment = async invoice => {
    try {
      const { data } = await api.post(`/invoices/${invoice.id}/check-payment`);
      dispatch({ type: "UPDATE_USERS", payload: data });
      if (data._paid) {
        toast.success(i18n.t("invoices.toasts.paymentConfirmed"));
      } else {
        toast.info(i18n.t("invoices.toasts.paymentNotFound"));
      }
    } catch (err) {
      toastError(err);
    }
  };

  const handleEmitNfse = async invoice => {
    try {
      const { data } = await api.post(`/invoices/${invoice.id}/nfse`);
      dispatch({ type: "UPDATE_USERS", payload: data });

      if (data._msg === "url_found" || data._msg === "nfse_emitted") {
        if (data.nfseUrl) {
          toast.success(i18n.t("invoices.toasts.nfseAvailable"));
          window.open(data.nfseUrl, "_blank");
        } else {
          toast.success(i18n.t("invoices.toasts.nfseEmitted"));
        }
      } else if (data._msg === "nfse_pending") {
        toast.info(i18n.t("invoices.toasts.nfsePending"));
      } else {
        toast.success(i18n.t("invoices.toasts.nfseProcessed"));
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
      return i18n.t("invoices.status.paid");
    }
    if (dias < 0) {
      return i18n.t("invoices.status.overdue");
    } else {
      return i18n.t("invoices.status.open");
    }
  };

  const canCheckPayment = invoice =>
    invoice.txId &&
    (invoice.payGw === "asaas" ||
      (invoice.payGw === "efi" && invoice.paymentMethod === "boleto"));

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
        <Title>{i18n.t("invoices.title")}</Title>
      </MainHeader>

      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Id</TableCell>
              <TableCell align="center">{i18n.t("invoices.columns.details")}</TableCell>
              <TableCell align="center">{i18n.t("invoices.columns.value")}</TableCell>
              <TableCell align="center">{i18n.t("invoices.columns.dueDate")}</TableCell>
              <TableCell align="center">{i18n.t("invoices.columns.status")}</TableCell>
              <TableCell align="center">{i18n.t("invoices.columns.action")}</TableCell>
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
                      {invoices.status !== "paid" ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleOpenContactModal(invoices)}
                          >
                            {i18n.t("invoices.buttons.pay")}
                          </Button>
                          {invoices.paymentMethod === "boleto" && invoices.boletoUrl && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(invoices.boletoUrl, "_blank")}
                            >
                              {i18n.t("invoices.buttons.viewBoleto")}
                            </Button>
                          )}
                          {canCheckPayment(invoices) && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleCheckPayment(invoices)}
                            >
                              {i18n.t("invoices.buttons.checkPayment")}
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button size="small" variant="outlined">
                            {i18n.t("invoices.buttons.paid")}
                          </Button>
                          {invoices.paymentMethod === "boleto" && invoices.boletoUrl && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(invoices.boletoUrl, "_blank")}
                            >
                              {i18n.t("invoices.buttons.viewBoleto")}
                            </Button>
                          )}
                          {invoices.nfseUrl ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => window.open(invoices.nfseUrl, "_blank")}
                            >
                              {i18n.t("invoices.buttons.viewNfse")}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleEmitNfse(invoices)}
                            >
                              {i18n.t("invoices.buttons.emitNfse")}
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
