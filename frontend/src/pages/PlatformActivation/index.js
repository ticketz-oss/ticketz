import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Button,
  CircularProgress,
  CssBaseline,
  Link,
  Paper,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { setStoredToken } from "../../helpers/token";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default
  },
  paper: {
    width: "100%",
    maxWidth: 420,
    padding: theme.spacing(4),
    borderRadius: 20
  },
  field: { marginTop: theme.spacing(2) },
  button: { marginTop: theme.spacing(3) },
  error: { color: theme.palette.error.main, marginTop: theme.spacing(2) }
}));

const PlatformActivation = () => {
  const classes = useStyles();
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get(`/auth/activation/${token}`)
      .then(({ data }) => {
        if (!active) return;
        setEmail(data.email);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        const code = err.response?.data?.error;
        setError(
          code && i18n.exists(`backendErrors.${code}`)
            ? i18n.t(`backendErrors.${code}`)
            : i18n.t("login.errors.activationInvalid")
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async event => {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError(i18n.t("login.errors.passwordMismatch"));
      return;
    }
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(i18n.t("login.errors.passwordStrength"));
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/password/setup", {
        token,
        password,
        password_confirmation: confirmation
      });
      setStoredToken(data.token);
      localStorage.setItem("companyId", String(data.user.companyId));
      localStorage.setItem("userId", String(data.user.id));
      window.location.replace("/");
    } catch (err) {
      const code = err.response?.data?.error;
      setError(
        code && i18n.exists(`backendErrors.${code}`)
          ? i18n.t(`backendErrors.${code}`)
          : i18n.t("login.errors.activationInvalid")
      );
      setSubmitting(false);
    }
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Paper className={classes.paper} elevation={4}>
        <Typography variant="h5" component="h1" gutterBottom>
          {i18n.t("login.activation.title")}
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : email ? (
          <form onSubmit={handleSubmit} noValidate>
            <Typography variant="body2">
              {i18n.t("login.activation.account", { email })}
            </Typography>
            <TextField
              className={classes.field}
              variant="outlined"
              required
              fullWidth
              autoFocus
              type="password"
              label={i18n.t("login.form.newPassword")}
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <TextField
              className={classes.field}
              variant="outlined"
              required
              fullWidth
              type="password"
              label={i18n.t("login.form.confirmPassword")}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              autoComplete="new-password"
              helperText={i18n.t("login.form.passwordStrength")}
            />
            {error && (
              <Typography className={classes.error} role="alert">
                {error}
              </Typography>
            )}
            <Button
              className={classes.button}
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {i18n.t("login.buttons.createPassword")}
            </Button>
          </form>
        ) : (
          <>
            <Typography className={classes.error} role="alert">
              {error}
            </Typography>
            <Link component={RouterLink} to="/login">
              {i18n.t("login.buttons.backToLogin")}
            </Link>
          </>
        )}
      </Paper>
    </div>
  );
};

export default PlatformActivation;
