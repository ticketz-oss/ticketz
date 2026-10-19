import ThemeSelector from "../../../components/ThemeSelector";
import React, { useContext, useState } from "react";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import { PartnerAuthContext } from "../../../context/PartnerAuth/PartnerAuthContext";

export const usePartnerAuthStyles = makeStyles(theme => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  backgroundLayer: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(to right, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.primary.main}, ${theme.palette.background.default}, ${theme.palette.background.default})`,
    backgroundColor: theme.palette.background.default,
    backgroundSize: "200% 200%",
    animation: "$gradientDrift 18s ease-in-out infinite",
    willChange: "background-position",
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none"
    }
  },
  "@keyframes gradientDrift": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" }
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1.5)
    }
  },
  themeToggle: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2,
    color: theme.palette.type === "light" ? "#142033" : "#fff",
    background:
      theme.palette.type === "light"
        ? "rgba(255,255,255,0.68)"
        : "rgba(6,12,22,0.5)",
    border:
      theme.palette.type === "light"
        ? "1px solid rgba(255,255,255,0.8)"
        : "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(12px)"
  },
  paper: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 32px 28px",
    borderRadius: 28,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    [theme.breakpoints.down("xs")]: {
      padding: "24px 16px 20px",
      borderRadius: 16
    }
  },
  logoImg: {
    width: "100%",
    maxWidth: 220,
    margin: "0 auto 8px",
    content: `url("${theme.calculatedLogo()}")`
  },
  subtitle: {
    marginBottom: theme.spacing(1),
    textAlign: "center",
    opacity: 0.75
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 1)
  }
}));

const PartnerLogin = () => {
  const classes = usePartnerAuthStyles();
  const { handleLogin, loading } = useContext(PartnerAuthContext);

  const [user, setUser] = useState({ email: "", password: "" });

  const handleChangeInput = e => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    handleLogin(user).catch(() => {});
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
          <Typography variant="body2" className={classes.subtitle}>
            Portal de Parceiros
          </Typography>
          <form className={classes.form} noValidate onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              value={user.email}
              onChange={handleChangeInput}
              autoComplete="email"
              autoFocus
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              value={user.password}
              onChange={handleChangeInput}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading}
            >
              Entrar
            </Button>
          </form>
        </Paper>
      </div>
    </div>
  );
};

export default PartnerLogin;
