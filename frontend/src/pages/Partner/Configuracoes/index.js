import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import ButtonWithSpinner from "../../../components/ButtonWithSpinner";
import MainContainer from "../../../components/MainContainer";
import MainHeader from "../../../components/MainHeader";
import Title from "../../../components/Title";
import partnerApi from "../../../services/partnerApi";
import toastError from "../../../errors/toastError";
import { formatCurrency } from "../format";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  section: {
    marginBottom: theme.spacing(2)
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 600
  },
  modeCard: {
    height: "100%"
  },
  modeCardSelected: {
    height: "100%",
    borderColor: theme.palette.primary.main,
    borderWidth: 2
  },
  hint: {
    display: "block",
    marginTop: theme.spacing(0.5)
  }
}));

const PIX_KEY_TYPES = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "PHONE", label: "Telefone" },
  { value: "EMAIL", label: "E-mail" },
  { value: "RANDOM", label: "Chave aleatória" }
];

const payoutDays = Array.from({ length: 28 }, (_, index) => index + 1);

const PartnerConfiguracoes = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixFee, setPixFee] = useState(1.3);
  const [form, setForm] = useState({
    pixKey: "",
    pixKeyType: "",
    payoutMode: "immediate",
    payoutDay: 5
  });
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    partnerApi
      .get("/partner/settings")
      .then(({ data }) => {
        setForm({
          pixKey: data.pixKey || "",
          pixKeyType: data.pixKeyType || "",
          payoutMode: data.payoutMode || "immediate",
          payoutDay: data.payoutDay || 5
        });
        setDiscountPct(data.discountPct || 0);
        if (data.pixFee !== undefined && data.pixFee !== null) {
          setPixFee(Number(data.pixFee));
        }
      })
      .catch(toastError)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = field => event => {
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await partnerApi.put("/partner/settings", {
        pixKey: form.pixKey,
        pixKeyType: form.pixKeyType,
        payoutMode: form.payoutMode,
        payoutDay:
          form.payoutMode === "scheduled" ? Number(form.payoutDay) : null
      });
      toast.success("Configurações salvas!");
    } catch (error) {
      toastError(error);
    }
    setSaving(false);
  };

  return (
    <MainContainer className="sd-business sd-partner-settings">
      <MainHeader>
        <Title>Configurações</Title>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <div className={`${classes.section} sd-partner-section`}>
          <Typography
            className={`${classes.sectionTitle} sd-partner-section-title`}
          >
            Seu desconto de revenda
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Você compra cada plano com <strong>{discountPct}%</strong> de
            desconto e fica com tudo o que cobrar acima desse valor.
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            className={classes.hint}
          >
            Em toda fatura paga a plataforma recebe sempre o mesmo: o preço do
            plano menos o seu desconto. O que passar disso é seu, qualquer que
            seja o preço que você cobrar do cliente. Para alterar esse
            percentual, fale com o administrador.
          </Typography>
        </div>

        <div className={`${classes.section} sd-partner-section`}>
          <Typography
            className={`${classes.sectionTitle} sd-partner-section-title`}
          >
            Chave Pix
          </Typography>
          <Grid spacing={2} container>
            <Grid xs={12} sm={4} item>
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel id="pix-key-type-label">Tipo da chave</InputLabel>
                <Select
                  labelId="pix-key-type-label"
                  label="Tipo da chave"
                  value={form.pixKeyType}
                  onChange={handleChange("pixKeyType")}
                  disabled={loading}
                >
                  {PIX_KEY_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={8} item>
              <TextField
                label="Chave Pix"
                variant="outlined"
                margin="dense"
                fullWidth
                value={form.pixKey}
                onChange={handleChange("pixKey")}
                disabled={loading}
                helperText="Sem chave cadastrada os repasses ficam retidos e são enviados assim que você informar a chave."
              />
            </Grid>
          </Grid>
        </div>

        <div className={`${classes.section} sd-partner-section`}>
          <Typography
            className={`${classes.sectionTitle} sd-partner-section-title`}
          >
            Como você quer receber
          </Typography>
          <RadioGroup
            value={form.payoutMode}
            onChange={handleChange("payoutMode")}
          >
            <Grid spacing={2} container>
              <Grid xs={12} md={6} item>
                <Card
                  variant="outlined"
                  className={
                    form.payoutMode === "immediate"
                      ? classes.modeCardSelected
                      : classes.modeCard
                  }
                >
                  <CardContent>
                    <FormControlLabel
                      value="immediate"
                      control={<Radio color="primary" />}
                      label="Imediato"
                    />
                    <Typography variant="body2" color="textSecondary">
                      O Pix sai assim que cada cliente paga. Cada repasse tem a
                      tarifa de {formatCurrency(pixFee)} descontada do seu
                      valor.
                    </Typography>
                    <Typography variant="caption" className={classes.hint}>
                      Exemplo com 10 clientes no mês:{" "}
                      {formatCurrency(pixFee * 10)} em tarifas.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} md={6} item>
                <Card
                  variant="outlined"
                  className={
                    form.payoutMode === "scheduled"
                      ? classes.modeCardSelected
                      : classes.modeCard
                  }
                >
                  <CardContent>
                    <FormControlLabel
                      value="scheduled"
                      control={<Radio color="primary" />}
                      label="Agendado"
                    />
                    <Typography variant="body2" color="textSecondary">
                      As comissões acumulam e saem num único Pix no dia
                      escolhido. A tarifa desse envio é por nossa conta — você
                      recebe o valor cheio.
                    </Typography>
                    <Typography variant="caption" className={classes.hint}>
                      Exemplo com 10 clientes no mês: {formatCurrency(0)} em
                      tarifas para você.
                    </Typography>
                    {form.payoutMode === "scheduled" && (
                      <FormControl
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        style={{ marginTop: 12 }}
                      >
                        <InputLabel id="payout-day-label">
                          Dia do pagamento
                        </InputLabel>
                        <Select
                          labelId="payout-day-label"
                          label="Dia do pagamento"
                          value={form.payoutDay}
                          onChange={handleChange("payoutDay")}
                        >
                          {payoutDays.map(day => (
                            <MenuItem key={day} value={day}>
                              Dia {day}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>
        </div>

        <ButtonWithSpinner
          loading={saving}
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          Salvar
        </ButtonWithSpinner>
      </Paper>
    </MainContainer>
  );
};

export default PartnerConfiguracoes;
