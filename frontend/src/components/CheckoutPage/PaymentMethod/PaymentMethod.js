import React, { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Radio,
  TextField,
  CircularProgress
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PixIcon from "@material-ui/icons/AccountBalanceWallet";
import CreditCardIcon from "@material-ui/icons/CreditCard";
import ReceiptIcon from "@material-ui/icons/Receipt";

import api from "../../../services/api";
import toastError from "../../../errors/toastError";
import { formatTaxId } from "../../../utils/formatTaxId";

const useStyles = makeStyles(theme => ({
  card: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1),
    border: `2px solid transparent`,
    transition: "border-color 0.2s"
  },
  cardSelected: {
    borderColor: theme.palette.primary.main
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main
  },
  grow: {
    flexGrow: 1
  },
  total: {
    fontWeight: "bold"
  },
  fee: {
    color: theme.palette.text.secondary
  }
}));

const money = value =>
  `R$${Number(value || 0).toLocaleString("pt-br", {
    minimumFractionDigits: 2
  })}`;

export default function PaymentMethod({ invoiceId }) {
  const classes = useStyles();
  const { values, setFieldValue } = useFormikContext();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const method = values.method || "pix";

  useEffect(() => {
    let mounted = true;
    const fetchQuote = async () => {
      try {
        const { data } = await api.get(`/subscription/quote/${invoiceId}`);
        if (mounted) setQuote(data);
      } catch (err) {
        toastError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchQuote();
    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  if (loading || !quote) {
    return (
      <Grid container justify="center" style={{ padding: 24 }}>
        <CircularProgress size={28} />
      </Grid>
    );
  }

  const options = [
    {
      key: "pix",
      label: "PIX",
      icon: <PixIcon className={classes.icon} />,
      total: quote.pix.total,
      fee: quote.pix.fee
    },
    {
      key: "card",
      label: "Cartão de crédito",
      icon: <CreditCardIcon className={classes.icon} />,
      total: quote.card.total,
      fee: quote.card.fee
    },
    {
      key: "boleto",
      label: "Boleto bancário",
      icon: <ReceiptIcon className={classes.icon} />,
      total: quote.boleto.total,
      fee: quote.boleto.fee
    }
  ];

  const selectMethod = m => setFieldValue("method", m);

  const selected = options.find(o => o.key === method) || options[0];

  const taxId = values.taxId || "";

  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom style={{ marginTop: 16 }}>
        Forma de pagamento
      </Typography>
      <Typography variant="body2" className={classes.fee} gutterBottom>
        Valor do plano: {money(quote.base)} — a taxa do método é somada por
        cima.
      </Typography>

      <Grid container spacing={1}>
        {options.map(opt => (
          <Grid item xs={12} key={opt.key}>
            <Card
              variant="outlined"
              className={`${classes.card} sd-payment-option ${
                method === opt.key ? classes.cardSelected : ""
              }`}
              data-selected={method === opt.key}
              onClick={() => selectMethod(opt.key)}
            >
              <Radio checked={method === opt.key} color="primary" />
              {opt.icon}
              <CardContent style={{ padding: 4 }} className={classes.grow}>
                <Typography>{opt.label}</Typography>
                <Typography variant="body2" className={classes.fee}>
                  Taxa: {money(opt.fee)}
                </Typography>
              </CardContent>
              <Typography className={classes.total}>
                {money(opt.total)}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {method === "card" && (
        <Typography
          variant="body2"
          className={classes.fee}
          style={{ marginTop: 12 }}
        >
          O parcelamento (à vista ou em até 3x) é escolhido na página de
          pagamento.
        </Typography>
      )}

      {method === "boleto" && (
        <TextField
          label="CPF/CNPJ do pagador"
          required
          fullWidth
          margin="normal"
          helperText="Obrigatório para emissão do boleto"
          value={taxId}
          onChange={e => setFieldValue("taxId", formatTaxId(e.target.value))}
          inputProps={{ inputMode: "numeric", maxLength: 18 }}
        />
      )}

      <Typography variant="h6" style={{ marginTop: 16 }}>
        Total a pagar: {money(selected.total)}
      </Typography>
    </Grid>
  );
}
