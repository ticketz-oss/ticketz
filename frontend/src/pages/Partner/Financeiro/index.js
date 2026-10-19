import StardewBusinessGlyph from "../../../components/StardewBusinessGlyph";
import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";

import {
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import MainContainer from "../../../components/MainContainer";
import MainHeader from "../../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../../components/TableRowSkeleton";
import Title from "../../../components/Title";
import partnerApi from "../../../services/partnerApi";
import toastError from "../../../errors/toastError";
import { formatCurrency, payoutStatusLabel } from "../format";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  cards: {
    marginBottom: theme.spacing(1)
  },
  cardValue: {
    fontSize: "1.4rem",
    fontWeight: 600
  },
  filters: {
    marginBottom: theme.spacing(1)
  }
}));

const startOfMonth = () => moment().startOf("month").format("YYYY-MM-DD");
const endOfMonth = () => moment().endOf("month").format("YYYY-MM-DD");

const PartnerFinanceiro = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [totals, setTotals] = useState({
    gross: 0,
    fees: 0,
    paid: 0,
    pending: 0
  });
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await partnerApi.get("/partner/payouts", {
        params: { startDate, endDate }
      });
      setPayouts(data.payouts);
      setTotals(data.totals);
    } catch (error) {
      toastError(error);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const summaryCards = [
    { label: "Comissão bruta", value: totals.gross },
    { label: "Tarifas Pix", value: totals.fees },
    { label: "Já repassado", value: totals.paid },
    { label: "A receber", value: totals.pending }
  ];

  return (
    <MainContainer className="sd-business sd-partner-finance">
      <MainHeader>
        <Title>Financeiro</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            label="De"
            type="date"
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <TextField
            label="Até"
            type="date"
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={loadPayouts}>
            Filtrar
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Grid spacing={1} container className={classes.cards}>
        {summaryCards.map(card => (
          <Grid xs={6} md={3} item key={card.label}>
            <Card variant="outlined" className="sd-gold-card">
              <CardContent>
                <Typography variant="caption" color="textSecondary">
                  {card.label}
                </Typography>
                <Typography className={`${classes.cardValue} sd-gold-value`}>
                  <StardewBusinessGlyph />
                  {formatCurrency(card.value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Cliente</TableCell>
              <TableCell align="left">Competência</TableCell>
              <TableCell align="right">Valor da venda</TableCell>
              <TableCell align="right">Custo plataforma</TableCell>
              <TableCell align="right">Sua margem</TableCell>
              <TableCell align="right">Tarifa</TableCell>
              <TableCell align="right">Líquido</TableCell>
              <TableCell align="center">Cliente pagou</TableCell>
              <TableCell align="center">Repasse</TableCell>
              <TableCell align="center">Comprovante</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRowSkeleton columns={10} />}
            {!loading && payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Nenhum repasse no período selecionado.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              payouts.map(row => (
                <TableRow key={row.id}>
                  <TableCell align="left">{row.company?.name || "-"}</TableCell>
                  <TableCell align="left">
                    {row.invoice?.dueDate
                      ? moment(row.invoice.dueDate).format("MM/YYYY")
                      : moment(row.createdAt).format("MM/YYYY")}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.baseValue)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.platformCost)}
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
                    {row.invoice?.status === "paid" ? "Sim" : "-"}
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default PartnerFinanceiro;
