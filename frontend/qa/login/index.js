// The production Login and LoginCustomization components, with external services mocked.
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import { Button, CssBaseline, Paper, Typography } from "@material-ui/core";
import { toast, ToastContainer } from "react-toastify";
import Login from "../../src/pages/Login";
import LoginCustomization from "../../src/components/Settings/LoginCustomization";
import ColorModeContext from "../../src/layout/themeContext";
import {
  coresInterface,
  tipografiaInterface
} from "../../src/theme/identidadeVisual";
import criarAjustesVisuais from "../../src/theme/overrides";
import { AuthContext, readSettings, saveSetting } from "./fixtures";
import "react-toastify/dist/ReactToastify.css";

function CustomizationPreview() {
  const [settings, setSettings] = useState(readSettings);
  return (
    <main style={{ maxWidth: 1280, margin: "40px auto", padding: "0 24px" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Personalização do login · QA local
      </Typography>
      <Typography color="textSecondary" paragraph>
        Componente real, com alterações mantidas somente na memória desta
        prévia. Nenhuma conexão com dev ou produção.
      </Typography>
      <Paper style={{ padding: 24 }} elevation={0}>
        <LoginCustomization
          settings={settings}
          onSave={async (key, value) => {
            await saveSetting(key, value);
            setSettings(readSettings());
          }}
        />
        <Button component={Link} to="/" variant="outlined" color="primary">
          Ver login real com estas opções
        </Button>
      </Paper>
    </main>
  );
}

function Preview() {
  const [mode, setMode] = useState("light");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          type: mode,
          primary: { main: mode === "dark" ? "#FF8A43" : "#C2480A" },
          text: {
            primary: coresInterface(mode).texto,
            secondary: coresInterface(mode).secundario
          },
          divider: coresInterface(mode).borda,
          background: {
            default: coresInterface(mode).fundo,
            paper: coresInterface(mode).superficie
          }
        },
        overrides: criarAjustesVisuais(mode),
        typography: tipografiaInterface,
        shape: { borderRadius: 8 }
      }),
    [mode]
  );
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode(current => (current === "light" ? "dark" : "light"))
    }),
    []
  );
  const auth = useMemo(
    () => ({
      loading: false,
      handleLogin: async () => {
        toast.info(
          "Prévia local: formulário validado. Nenhuma autenticação real foi realizada."
        );
      },
      handlePasswordSetup: async () => {
        toast.info(
          "Prévia local: formulário validado. Nenhuma senha foi criada ou salva."
        );
      }
    }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <ColorModeContext.Provider value={{ colorMode }}>
        <AuthContext.Provider value={auth}>
          <BrowserRouter>
            <CssBaseline />
            <Switch>
              <Route path="/settings" component={CustomizationPreview} />
              <Route path="/" component={Login} />
            </Switch>
            <ToastContainer position="bottom-right" />
          </BrowserRouter>
        </AuthContext.Provider>
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}

ReactDOM.render(<Preview />, document.getElementById("root"));
