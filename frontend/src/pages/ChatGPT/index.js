import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExtensionOutlinedIcon from "@material-ui/icons/ExtensionOutlined";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import LinkOffOutlinedIcon from "@material-ui/icons/LinkOffOutlined";
import OpenInNewOutlinedIcon from "@material-ui/icons/OpenInNewOutlined";
import SettingsEthernetOutlinedIcon from "@material-ui/icons/SettingsEthernetOutlined";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { canSeeScreen } from "../../helpers/screenAccess";
import { i18n } from "../../translate/i18n";

const CHATGPT_PLUGIN_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_6a7f43d763d8819194733163f90a8d7b";
// const MARKETPLACE_REPOSITORY = "https://github.com/GuiZeroUm/ticketz";

const useStyles = makeStyles(theme => ({
  root: { flex: 1 },
  content: { overflowY: "auto" },
  tabs: { borderBottom: `1px solid ${theme.palette.divider}` },
  tabPanel: { padding: theme.spacing(3) },
  card: { padding: theme.spacing(3), height: "100%" },
  urlRow: {
    display: "flex",
    gap: theme.spacing(1),
    alignItems: "center",
    [theme.breakpoints.down("xs")]: {
      alignItems: "stretch",
      flexDirection: "column"
    }
  },
  grow: { flex: 1 },
  status: { marginLeft: theme.spacing(1) },
  table: { marginTop: theme.spacing(2) },
  pluginHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("xs")]: {
      alignItems: "flex-start"
    }
  },
  pluginIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    objectFit: "cover",
    boxShadow: theme.shadows[2]
  },
  pluginActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2)
  },
  marketplaceValues: {
    display: "grid",
    gridTemplateColumns: "minmax(100px, auto) 1fr",
    gap: theme.spacing(1, 2),
    marginTop: theme.spacing(2),
    wordBreak: "break-word"
  }
}));

const formatDate = value =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date(value))
    : "—";

const ChatGPT = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/chatgpt/integration");
      setData(response.data);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!canSeeScreen(user, "chatgpt")) return null;

  const copyMcpUrl = async () => {
    await navigator.clipboard.writeText(data.mcpUrl);
    toast.success(i18n.t("chatgpt.toasts.copied"));
  };

  /*
  const copyRepository = async () => {
    await navigator.clipboard.writeText(MARKETPLACE_REPOSITORY);
    toast.success(i18n.t("chatgpt.toasts.repositoryCopied"));
  };
  */

  const revoke = async () => {
    try {
      if (confirm === "all") await api.delete("/chatgpt/integration/grants");
      else await api.delete(`/chatgpt/integration/grants/${confirm}`);
      toast.success(i18n.t("chatgpt.toasts.revoked"));
      setConfirm(null);
      load();
    } catch (error) {
      toastError(error);
    }
  };

  const renderConnections = () => (
    <Grid item xs={12}>
      <Paper variant="outlined" className={`${classes.card} sd-workshop-card`}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {i18n.t("chatgpt.connections.title")}
          </Typography>
          {data.grants.length > 0 && (
            <Button
              color="secondary"
              startIcon={<LinkOffOutlinedIcon />}
              onClick={() => setConfirm("all")}
            >
              {i18n.t("chatgpt.connections.revokeAll")}
            </Button>
          )}
        </Box>
        {data.grants.length === 0 ? (
          <Typography color="textSecondary" paragraph>
            {i18n.t("chatgpt.connections.empty")}
          </Typography>
        ) : (
          <Box overflow="auto">
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{i18n.t("chatgpt.connections.client")}</TableCell>
                  <TableCell>{i18n.t("chatgpt.connections.admin")}</TableCell>
                  <TableCell>{i18n.t("chatgpt.connections.created")}</TableCell>
                  <TableCell>{i18n.t("chatgpt.connections.lastUse")}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.grants.map(grant => (
                  <TableRow key={grant.id}>
                    <TableCell>{grant.client}</TableCell>
                    <TableCell>
                      {grant.administrator?.name}
                      <br />
                      <small>{grant.administrator?.email}</small>
                    </TableCell>
                    <TableCell>{formatDate(grant.createdAt)}</TableCell>
                    <TableCell>{formatDate(grant.lastUsedAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        color="secondary"
                        onClick={() => setConfirm(grant.id)}
                      >
                        {i18n.t("chatgpt.connections.revoke")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Grid>
  );

  return (
    <MainContainer className={`${classes.root} sd-business sd-integration`}>
      <ConfirmationModal
        open={Boolean(confirm)}
        title={i18n.t("chatgpt.revoke.title")}
        onClose={() => setConfirm(null)}
        onConfirm={revoke}
      >
        {i18n.t(
          confirm === "all" ? "chatgpt.revoke.all" : "chatgpt.revoke.one"
        )}
      </ConfirmationModal>
      <MainHeader>
        <Title>
          {i18n.t("chatgpt.title")}
          {data && (
            <Chip
              className={classes.status}
              size="small"
              color={data.enabled ? "primary" : "default"}
              label={i18n.t(
                data.enabled ? "chatgpt.enabled" : "chatgpt.disabled"
              )}
            />
          )}
        </Title>
      </MainHeader>
      <Paper className={classes.content}>
        <Tabs
          className={classes.tabs}
          value={tab}
          onChange={(_, value) => setTab(value)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<ExtensionOutlinedIcon />}
            label={i18n.t("chatgpt.tabs.plugin")}
          />
          <Tab
            icon={<SettingsEthernetOutlinedIcon />}
            label={i18n.t("chatgpt.tabs.mcp")}
          />
        </Tabs>
        {loading || !data ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          <Box className={classes.tabPanel}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper
                  variant="outlined"
                  className={`${classes.card} sd-workshop-card`}
                >
                  <div className={classes.pluginHeader}>
                    <img
                      className={`${classes.pluginIcon} sd-item-icon`}
                      src="/branding/plugin-espaco-whats.png"
                      alt={i18n.t("chatgpt.plugin.name")}
                    />
                    <Box>
                      <Box display="flex" alignItems="center" flexWrap="wrap">
                        <Typography variant="h5">
                          {i18n.t("chatgpt.plugin.name")}
                        </Typography>
                        <Chip
                          className={classes.status}
                          size="small"
                          color="primary"
                          label={i18n.t("chatgpt.plugin.recommended")}
                        />
                      </Box>
                      <Typography color="textSecondary">
                        {i18n.t("chatgpt.plugin.description")}
                      </Typography>
                    </Box>
                  </div>
                  <Typography variant="body2">
                    {i18n.t("chatgpt.plugin.details")}
                  </Typography>
                  <div className={classes.pluginActions}>
                    <Button
                      component="a"
                      href={CHATGPT_PLUGIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      color="primary"
                      startIcon={<OpenInNewOutlinedIcon />}
                    >
                      {i18n.t("chatgpt.plugin.open")}
                    </Button>
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper
                  variant="outlined"
                  className={`${classes.card} sd-workshop-card`}
                >
                  <Typography variant="h6">
                    {i18n.t("chatgpt.plugin.steps.title")}
                  </Typography>
                  <Stepper
                    activeStep={data.enabled ? 0 : -1}
                    orientation="vertical"
                  >
                    {["open", "install", "connect", "login", "use"].map(
                      step => (
                        <Step key={step}>
                          <StepLabel>
                            {i18n.t(`chatgpt.plugin.steps.${step}`)}
                          </StepLabel>
                        </Step>
                      )
                    )}
                  </Stepper>
                </Paper>
              </Grid>
              {/* <Grid item xs={12}>
                <Paper variant="outlined" className={`${classes.card} sd-workshop-card`}>
                  <Typography variant="h6">
                    {i18n.t("chatgpt.plugin.marketplace.title")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {i18n.t("chatgpt.plugin.marketplace.description")}
                  </Typography>
                  <div className={classes.marketplaceValues}>
                    <strong>
                      {i18n.t("chatgpt.plugin.marketplace.repository")}
                    </strong>
                    <span>{MARKETPLACE_REPOSITORY}</span>
                    <strong>{i18n.t("chatgpt.plugin.marketplace.path")}</strong>
                    <span>
                      {i18n.t("chatgpt.plugin.marketplace.pathValue")}
                    </span>
                    <strong>
                      {i18n.t("chatgpt.plugin.marketplace.branch")}
                    </strong>
                    <span>main</span>
                  </div>
                  <div className={classes.pluginActions}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<FileCopyOutlinedIcon />}
                      onClick={copyRepository}
                    >
                      {i18n.t("chatgpt.plugin.marketplace.copy")}
                    </Button>
                  </div>
                </Paper>
              </Grid> */}
              {renderConnections()}
            </Grid>
          </Box>
        ) : (
          <Box className={classes.tabPanel}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper
                  variant="outlined"
                  className={`${classes.card} sd-workshop-card`}
                >
                  <Typography variant="h6">
                    {i18n.t("chatgpt.connection.title")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {i18n.t("chatgpt.connection.description")}
                  </Typography>
                  <div className={classes.urlRow}>
                    <TextField
                      className={classes.grow}
                      variant="outlined"
                      size="small"
                      value={data.mcpUrl}
                      InputProps={{ readOnly: true }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FileCopyOutlinedIcon />}
                      onClick={copyMcpUrl}
                    >
                      {i18n.t("chatgpt.copy")}
                    </Button>
                  </div>
                  <Box mt={2}>
                    {data.scopes.map(scope => (
                      <Chip
                        key={scope}
                        label={scope}
                        size="small"
                        style={{ marginRight: 8, marginBottom: 8 }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper
                  variant="outlined"
                  className={`${classes.card} sd-workshop-card`}
                >
                  <Typography variant="h6">
                    {i18n.t("chatgpt.steps.title")}
                  </Typography>
                  <Stepper
                    activeStep={data.enabled ? 0 : -1}
                    orientation="vertical"
                  >
                    {["open", "create", "url", "oauth", "login"].map(step => (
                      <Step key={step}>
                        <StepLabel>{i18n.t(`chatgpt.steps.${step}`)}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Paper>
              </Grid>
              {renderConnections()}
            </Grid>
          </Box>
        )}
      </Paper>
    </MainContainer>
  );
};

export default ChatGPT;
