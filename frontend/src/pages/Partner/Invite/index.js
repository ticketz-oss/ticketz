import ThemeSelector from "../../../components/ThemeSelector";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

import partnerApi from "../../../services/partnerApi";
import toastError from "../../../errors/toastError";
import { PartnerAuthContext } from "../../../context/PartnerAuth/PartnerAuthContext";
import { usePartnerAuthStyles } from "../Login";

const MIN_PASSWORD_LENGTH = 6;

const PartnerInvite = () => {
  const classes = usePartnerAuthStyles();
  const history = useHistory();
  const { token } = useParams();
  const { loginWithToken } = useContext(PartnerAuthContext);

  const [checking, setChecking] = useState(true);
  const [invite, setInvite] = useState(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const { data } = await partnerApi.get(`/partner/invite/${token}`);
        setInvite(data);
      } catch (error) {
        toastError(error);
      }
      setChecking(false);
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`
      );
      return;
    }

    if (password !== confirmation) {
      toast.error("As senhas não conferem");
      return;
    }

    setSaving(true);
    try {
      const { data } = await partnerApi.post(`/partner/invite/${token}`, {
        password
      });
      loginWithToken(data.token, data.partner);
    } catch (error) {
      toastError(error);
      setSaving(false);
    }
  };

  return (
    <div className={`${classes.root} sd-partner-auth`}>
      <CssBaseline />
      <div className={classes.backgroundLayer} />
      <div className={classes.themeToggle}>
        <ThemeSelector />
      </div>
      <div className={classes.content}>
        <Paper className={classes.paper} elevation={6}>
          <img className={classes.logoImg} alt="logo" />

          {checking && <CircularProgress />}

          {!checking && !invite && (
            <>
              <Typography variant="body2" className={classes.subtitle}>
                Este convite é inválido ou já expirou. Peça um novo link ao
                administrador.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={() => history.push("/parceiros/login")}
              >
                Ir para o login
              </Button>
            </>
          )}

          {!checking && invite && (
            <>
              <Typography variant="body2" className={classes.subtitle}>
                Olá, {invite.name}! Defina a senha da sua conta de parceiro (
                {invite.email}).
              </Typography>
              <form className={classes.form} noValidate onSubmit={handleSubmit}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Nova senha"
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  name="confirmation"
                  label="Confirme a senha"
                  type="password"
                  id="confirmation"
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                  disabled={saving}
                >
                  Definir senha e entrar
                </Button>
              </form>
            </>
          )}
        </Paper>
      </div>
    </div>
  );
};

export default PartnerInvite;
