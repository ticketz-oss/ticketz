import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";

import {
  makeStyles,
  Button,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@material-ui/core";

import api from "../../services/api";
import TableRowSkeleton from "../TableRowSkeleton";
import { formatCurrency, payoutStatusLabel } from "../../pages/Partner/format";

const useStyles = makeStyles(theme => ({
  wrapper: {
    width: "100%",
    padding: theme.spacing(1),
    marginTop: theme.spacing(2)
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  tableContainer: {
    width: "100%",
    overflowX: "scroll",
    ...theme.scrollbarStyles
  },
  filters: {
    marginBottom: theme.spacing(1)
  }
}));

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Enviando" },
  { value: "paid", label: "Repassado" },
  { value: "failed", label: "Falhou" },
  { value: "awaiting_pix_key", label: "Aguardando chave Pix" }
];

const PartnerPayoutsPanel = ({ partners }) => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [totals, setTotals] = useState({
    gross: 0,
    fees: 0,
    paid: 0,
    pending: 0
  });
  const [partnerId, setPartnerId] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState(
    moment().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    moment().endOf("month").format("YYYY-MM-DD")
  );

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/partners/payouts", {
        params: {
          partnerId: partnerId || undefined,
          status: status || undefined,
          startDate,
          endDate
        }
      });
      setPayouts(data.payouts || []);
      setTotals(data.totals || { gross: 0, fees: 0, paid: 0, pending: 0 });
    } catch (e) {
      toast.error("Não foi possível carregar os repasses");
    }
    setLoading(false);
  }, [partnerId, status, startDate, endDate]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const handleRetry = async id => {
    setLoading(true);
    try {
      await api.post(`/partners/payouts/${id}/retry`);
      toast.success("Reenvio disparado.");
      await loadPayouts();
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Não foi possível reenviar este repasse"
      );
    }
    setLoading(false);
  };

  return (
    <Paper className={`${classes.wrapper} sd-payout-ledger`} variant="outlined">
      <Typography className={classes.title}>Repasses</Typography>

      <Grid
        spacing={1}
        container
        className={classes.filters}
        alignItems="center"
      >
        <Grid xs={12} sm={3} item>
          <FormControl margin="dense" variant="outlined" fullWidth>
            <InputLabel id="payout-partner-label">Parceiro</InputLabel>
            <Select
              labelId="payout-partner-label"
              label="Parceiro"
              value={partnerId}
              onChange={e => setPartnerId(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {partners.map(partner => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} item>
          <FormControl margin="dense" variant="outlined" fullWidth>
            <InputLabel id="payout-status-label">Situação</InputLabel>
            <Select
              labelId="payout-status-label"
              label="Situação"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={6} sm={2} item>
          <TextField
            label="De"
            type="date"
            margin="dense"
            variant="outlined"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </Grid>
        <Grid xs={6} sm={2} item>
          <TextField
            label="Até"
            type="date"
            margin="dense"
            variant="outlined"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={2} item>
          <Button variant="contained" color="primary" onClick={loadPayouts}>
            Filtrar
          </Button>
        </Grid>
      </Grid>

      <Typography variant="caption" color="textSecondary">
        Bruto {formatCurrency(totals.gross)} · Tarifas{" "}
        {formatCurrency(totals.fees)} · Repassado {formatCurrency(totals.paid)}{" "}
        · Em aberto {formatCurrency(totals.pending)}
      </Typography>

      <Paper className={classes.tableContainer} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Parceiro</TableCell>
              <TableCell align="left">Cliente</TableCell>
              <TableCell align="left">Competência</TableCell>
              <TableCell align="right">Venda</TableCell>
              <TableCell align="right">Bruto</TableCell>
              <TableCell align="right">Tarifa</TableCell>
              <TableCell align="right">Líquido</TableCell>
              <TableCell align="center">Situação</TableCell>
              <TableCell align="center">Comprovante</TableCell>
              <TableCell align="center">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRowSkeleton columns={10} />}
            {!loading && payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Nenhum repasse no período.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              payouts.map(row => (
                <TableRow key={row.id}>
                  <TableCell align="left">{row.partner?.name || "-"}</TableCell>
                  <TableCell align="left">{row.company?.name || "-"}</TableCell>
                  <TableCell align="left">
                    {moment(row.invoice?.dueDate || row.createdAt).format(
                      "MM/YYYY"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.baseValue)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.feeAmount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.netAmount)}
                  </TableCell>
                  <TableCell align="center">
                    {payoutStatusLabel(row.status)}
                    {row.failReason ? (
                      <Typography variant="caption" display="block">
                        {row.failReason}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {row.receiptUrl ? (
                      <Link
                        href={row.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {row.status === "paid" || row.status === "processing" ? (
                      "-"
                    ) : (
                      <Button size="small" onClick={() => handleRetry(row.id)}>
                        Reenviar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
    </Paper>
  );
};

export default PartnerPayoutsPanel;
