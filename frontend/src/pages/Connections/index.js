import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
  Button,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Box,
  Divider,
  Chip,
  Fab
} from "@material-ui/core";
import {
  Edit,
  DeleteOutline,
  Lock,
  Refresh,
  Replay,
  SettingsBackupRestore,
  Add as AddIcon,
  Update as UpdateIcon
} from "@material-ui/icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneSlash,
  faQrcode,
  faUserLock,
  faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import PasskeyModal from "../../components/PasskeyModal";
import PrivacyModal from "../../components/PrivacyModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import wavoipIcon from "../../assets/wavoip.webp";
import WavoipModal from "../../components/WavoipModal";
import { wavoipAvailable } from "../../helpers/wavoipCallManager";

// BEGIN: Feature flag for filtering unsupported channels
// Set to false on branches that support multiple channels
const FILTER_UNSUPPORTED_CHANNELS = true;
// END: Feature flag for filtering unsupported channels

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  cardsContainer: {
    width: "100%",
    padding: theme.spacing(1)
  },
  card: {
    position: "relative",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[4]
    }
  },
  statusChip: {
    position: "absolute",
    top: 8,
    right: 8,
    fontWeight: 600
  },
  statusConnected: {
    backgroundColor: "#4caf50",
    color: "#fff"
  },
  statusDisconnected: {
    backgroundColor: "#f44336",
    color: "#fff"
  },
  statusOpening: {
    backgroundColor: "#ff9800",
    color: "#fff"
  },
  statusQrCode: {
    backgroundColor: "#2196f3",
    color: "#fff"
  },
  statusTimeout: {
    backgroundColor: "#9e9e9e",
    color: "#fff"
  },
  statusPasskey: {
    backgroundColor: "#9c27b0",
    color: "#fff"
  },
  statusPending: {
    backgroundColor: "#ff9800",
    color: "#fff"
  },
  statusUnsupported: {
    backgroundColor: "#9e9e9e",
    color: "#fff"
  },
  cardContent: {
    paddingBottom: theme.spacing(1),
    "&:last-child": {
      paddingBottom: theme.spacing(1)
    }
  },
  connectionName: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    paddingRight: theme.spacing(10)
  },
  statsContainer: {
    marginTop: theme.spacing(2)
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 0)
  },
  statIcon: {
    color: theme.palette.primary.main,
    fontSize: 20
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem"
  },
  statValue: {
    fontWeight: 600,
    fontSize: "0.875rem"
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing(1)
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000
  },
  defaultChip: {
    backgroundColor: green[500],
    color: "#fff",
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2)
  }
}));

const Connections = () => {
  const classes = useStyles();

  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(
    confirmationModalInitialState
  );
  const [wavoipModalOpen, setWavoipModalOpen] = useState(false);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [passkeyInitialToken, setPasskeyInitialToken] = useState("");
  const [connectorReady, setConnectorReady] = useState(false);
  // BEGIN: Filter unsupported channels (easy to remove)
  const [showUnsupported, setShowUnsupported] = useState(false);
  // END: Filter unsupported channels
  const handleStartWhatsAppSession = async whatsAppId => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async whatsAppId => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

  const handleOpenQrModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleOpenPasskeyModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setPasskeyModalOpen(true);
  };

  const handleResetPasskeySession = async whatsAppId => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}/reset`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleClosePasskeyModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setPasskeyInitialToken("");
    setPasskeyModalOpen(false);
  }, [setPasskeyModalOpen, setSelectedWhatsApp, setPasskeyInitialToken]);

  const handleOpenInstallInstructionsFromQr = useCallback(() => {
    setQrModalOpen(false);
    setPasskeyInitialToken("");
    setPasskeyModalOpen(true);
  }, [setQrModalOpen, setPasskeyInitialToken, setPasskeyModalOpen]);

  const handleEditWhatsApp = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const handleOpenPrivacyWhatsApp = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setPrivacyModalOpen(true);
  };

  const handleClosePrivacyWhatsAppModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setPrivacyModalOpen(false);
  }, [setPrivacyModalOpen, setSelectedWhatsApp]);

  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async checked => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`, {
          params: { closeTickets: checked }
        });
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const handleOpenWavoipModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setWavoipModalOpen(true);
  };

  const handleCloseWavoipModal = useCallback(() => {
    setWavoipModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setWavoipModalOpen, setSelectedWhatsApp]);

  const refreshWhatsApp = async whatsApp => {
    try {
      await api.get(`/whatsappsession/refresh/${whatsApp.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const getStatusInfo = whatsApp => {
    switch (whatsApp.status) {
      case "CONNECTED":
        return {
          label: i18n.t("connections.status.connected"),
          class: classes.statusConnected
        };
      case "DISCONNECTED":
        return {
          label: i18n.t("connections.status.disconnected"),
          class: classes.statusDisconnected
        };
      case "OPENING":
        return {
          label: i18n.t("connections.status.opening"),
          class: classes.statusOpening
        };
      case "qrcode":
        return {
          label: i18n.t("connections.status.qrcode"),
          class: classes.statusQrCode
        };
      case "TIMEOUT":
      case "PAIRING":
        return {
          label: i18n.t("connections.status.timeout"),
          class: classes.statusTimeout
        };
      case "passkey_required":
        return {
          label: i18n.t("connections.status.passkey"),
          class: classes.statusPasskey
        };
      case "PENDING":
        return {
          label: i18n.t("connections.status.pending"),
          class: classes.statusPending
        };
      default:
        return {
          label: whatsApp.status,
          class: classes.statusDisconnected
        };
    }
  };

  const renderActionButtons = whatsApp => {
    const buttons = [];

    if (whatsApp.status === "qrcode") {
      buttons.push(
        <Tooltip key="qr" title={i18n.t("connections.toolTips.scan")}>
          <IconButton size="small" onClick={() => handleOpenQrModal(whatsApp)}>
            <FontAwesomeIcon icon={faQrcode} />
          </IconButton>
        </Tooltip>
      );
    }

    if (whatsApp.status === "passkey_required") {
      buttons.push(
        <Tooltip
          key="passkey"
          title={i18n.t("connections.toolTips.passkey.title")}
        >
          <IconButton
            size="small"
            onClick={() => handleOpenPasskeyModal(whatsApp)}
          >
            <FontAwesomeIcon icon={faUserLock} />
          </IconButton>
        </Tooltip>,
        <Tooltip
          key="reset"
          title={i18n.t("connections.toolTips.resetPasskey")}
        >
          <IconButton
            size="small"
            onClick={() => handleResetPasskeySession(whatsApp.id)}
          >
            <SettingsBackupRestore />
          </IconButton>
        </Tooltip>
      );
    }

    if (whatsApp.status === "DISCONNECTED") {
      buttons.push(
        <Tooltip key="retry" title={i18n.t("connections.toolTips.retry")}>
          <IconButton
            size="small"
            onClick={() => handleStartWhatsAppSession(whatsApp.id)}
          >
            <Replay />
          </IconButton>
        </Tooltip>,
        <Tooltip key="newqr" title={i18n.t("connections.toolTips.newQr")}>
          <IconButton
            size="small"
            onClick={() => handleRequestNewQrCode(whatsApp.id)}
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </IconButton>
        </Tooltip>
      );
    }

    if (
      whatsApp.status === "CONNECTED" ||
      whatsApp.status === "PAIRING" ||
      whatsApp.status === "TIMEOUT"
    ) {
      buttons.push(
        <Tooltip
          key="disconnect"
          title={i18n.t("connections.toolTips.disconnect")}
        >
          <IconButton
            size="small"
            onClick={() => {
              handleOpenConfirmationModal("disconnect", whatsApp.id);
            }}
          >
            <FontAwesomeIcon icon={faPhoneSlash} />
          </IconButton>
        </Tooltip>
      );
    }

    if (whatsApp.status === "CONNECTED" && whatsApp.channel === "whatsapp") {
      buttons.push(
        <Tooltip key="refresh" title={i18n.t("connections.toolTips.refresh")}>
          <IconButton size="small" onClick={() => refreshWhatsApp(whatsApp)}>
            <Refresh />
          </IconButton>
        </Tooltip>
      );
    }

    return buttons;
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
        checkbox={
          confirmModalInfo.action === "delete"
            ? i18n.t("connections.confirmationModal.closeTickets")
            : undefined
        }
      >
        {confirmModalInfo.message}
      </ConfirmationModal>
      <QrcodeModal
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        onOpenPasskeyModal={handleOpenInstallInstructionsFromQr}
        connectorReady={connectorReady}
        whatsAppId={
          !whatsAppModalOpen && !privacyModalOpen && selectedWhatsApp?.id
        }
      />
      <PasskeyModal
        open={passkeyModalOpen}
        onClose={handleClosePasskeyModal}
        captureToken={passkeyInitialToken}
        onConnectorReady={() => setConnectorReady(true)}
        whatsAppId={
          !whatsAppModalOpen && !privacyModalOpen && selectedWhatsApp?.id
        }
      />
      <WhatsAppModal
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        whatsAppId={!qrModalOpen && !privacyModalOpen && selectedWhatsApp?.id}
      />
      <PrivacyModal
        open={privacyModalOpen}
        onClose={handleClosePrivacyWhatsAppModal}
        whatsAppId={!qrModalOpen && !whatsAppModalOpen && selectedWhatsApp?.id}
      />
      <WavoipModal
        open={wavoipModalOpen}
        onClose={handleCloseWavoipModal}
        whatsappId={selectedWhatsApp?.id}
      />
      <MainHeader>
        <Title>{i18n.t("connections.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenWhatsAppModal}
          >
            {i18n.t("connections.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Box className={classes.mainPaper}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        ) : (
          <div className={classes.cardsContainer}>
            {/* BEGIN: Filter unsupported channels (controlled by FILTER_UNSUPPORTED_CHANNELS flag) */}
            {FILTER_UNSUPPORTED_CHANNELS &&
              (() => {
                const unsupportedConnections = whatsApps?.filter(
                  w => w.channel !== "whatsapp"
                );
                const hasUnsupported =
                  unsupportedConnections && unsupportedConnections.length > 0;
                const filteredConnections = showUnsupported
                  ? whatsApps
                  : whatsApps?.filter(w => w.channel === "whatsapp");

                return (
                  <>
                    {hasUnsupported && !showUnsupported && (
                      <Box display="flex" justifyContent="center" mb={2}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => setShowUnsupported(true)}
                        >
                          {i18n.t("connections.buttons.showUnsupported")} (
                          {unsupportedConnections.length})
                        </Button>
                      </Box>
                    )}
                    {hasUnsupported && showUnsupported && (
                      <Box display="flex" justifyContent="center" mb={2}>
                        <Button
                          variant="outlined"
                          color="default"
                          onClick={() => setShowUnsupported(false)}
                        >
                          {i18n.t("connections.buttons.hideUnsupported")}
                        </Button>
                      </Box>
                    )}
                    {filteredConnections?.length > 0 ? (
                      <Grid container spacing={2}>
                        {filteredConnections.map(whatsApp => {
                          const isUnsupported = whatsApp.channel !== "whatsapp";
                          const statusInfo = isUnsupported
                            ? {
                                label: i18n.t("connections.status.unsupported"),
                                class: classes.statusUnsupported
                              }
                            : getStatusInfo(whatsApp);
                          return (
                            <Grid item xs={12} sm={6} md={4} key={whatsApp.id}>
                              <Card className={classes.card} variant="outlined">
                                <CardContent className={classes.cardContent}>
                                  <Chip
                                    label={statusInfo.label}
                                    size="small"
                                    className={`${classes.statusChip} ${statusInfo.class}`}
                                  />

                                  <Typography
                                    variant="h6"
                                    component="h2"
                                    className={classes.connectionName}
                                  >
                                    {whatsApp.name || "-"}
                                  </Typography>

                                  {whatsApp.isDefault && !isUnsupported && (
                                    <Chip
                                      label={i18n.t(
                                        "connections.table.default"
                                      )}
                                      size="small"
                                      className={classes.defaultChip}
                                    />
                                  )}

                                  {!isUnsupported && (
                                    <Box className={classes.statsContainer}>
                                      <Typography
                                        className={classes.sectionTitle}
                                      >
                                        {i18n.t("connections.table.session")}
                                      </Typography>
                                      <Grid container spacing={1}>
                                        <Grid
                                          item
                                          xs={12}
                                          className={classes.statItem}
                                        >
                                          <UpdateIcon
                                            className={classes.statIcon}
                                          />
                                          <Box>
                                            <Typography
                                              className={classes.statLabel}
                                            >
                                              {i18n.t(
                                                "connections.table.lastUpdate"
                                              )}
                                            </Typography>
                                            <Typography
                                              className={classes.statValue}
                                            >
                                              {format(
                                                parseISO(whatsApp.updatedAt),
                                                "dd/MM/yy HH:mm"
                                              )}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  )}

                                  {!isUnsupported && (
                                    <Divider className={classes.divider} />
                                  )}

                                  <Box>
                                    <Typography
                                      className={classes.sectionTitle}
                                    >
                                      {i18n.t("connections.table.actions")}
                                    </Typography>
                                    <Box
                                      display="flex"
                                      flexWrap="wrap"
                                      style={{ gap: 4 }}
                                    >
                                      {isUnsupported ? (
                                        <Tooltip
                                          title={i18n.t("common.delete")}
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={e => {
                                              handleOpenConfirmationModal(
                                                "delete",
                                                whatsApp.id
                                              );
                                            }}
                                          >
                                            <DeleteOutline />
                                          </IconButton>
                                        </Tooltip>
                                      ) : (
                                        <>
                                          <Tooltip
                                            title={i18n.t("common.edit")}
                                          >
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleEditWhatsApp(whatsApp)
                                              }
                                            >
                                              <Edit />
                                            </IconButton>
                                          </Tooltip>

                                          {whatsApp.status === "CONNECTED" &&
                                            whatsApp.channel === "whatsapp" && (
                                              <Tooltip
                                                title={i18n.t(
                                                  "connections.toolTips.privacy"
                                                )}
                                              >
                                                <IconButton
                                                  size="small"
                                                  onClick={() =>
                                                    handleOpenPrivacyWhatsApp(
                                                      whatsApp
                                                    )
                                                  }
                                                >
                                                  <Lock />
                                                </IconButton>
                                              </Tooltip>
                                            )}

                                          {false &&
                                            whatsApp.channel === "whatsapp" &&
                                            wavoipAvailable() && (
                                              <Tooltip title="Wavoip">
                                                <IconButton
                                                  size="small"
                                                  onClick={() =>
                                                    handleOpenWavoipModal(
                                                      whatsApp
                                                    )
                                                  }
                                                >
                                                  <img
                                                    src={wavoipIcon}
                                                    alt="Wavoip"
                                                    style={{
                                                      width: 20,
                                                      height: 20
                                                    }}
                                                  />
                                                </IconButton>
                                              </Tooltip>
                                            )}

                                          <Tooltip
                                            title={i18n.t("common.delete")}
                                          >
                                            <IconButton
                                              size="small"
                                              onClick={e => {
                                                handleOpenConfirmationModal(
                                                  "delete",
                                                  whatsApp.id
                                                );
                                              }}
                                            >
                                              <DeleteOutline />
                                            </IconButton>
                                          </Tooltip>

                                          {renderActionButtons(whatsApp)}
                                        </>
                                      )}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Box className={classes.loadingContainer}>
                        <Typography variant="body1" color="textSecondary">
                          {i18n.t("connections.noConnections")}
                        </Typography>
                      </Box>
                    )}
                  </>
                );
              })()}

            {/* Show all connections when filter is disabled */}
            {!FILTER_UNSUPPORTED_CHANNELS && (
              <>
                {whatsApps?.length > 0 ? (
                  <Grid container spacing={2}>
                    {whatsApps.map(whatsApp => {
                      const statusInfo = getStatusInfo(whatsApp);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={whatsApp.id}>
                          <Card className={classes.card} variant="outlined">
                            <CardContent className={classes.cardContent}>
                              <Chip
                                label={statusInfo.label}
                                size="small"
                                className={`${classes.statusChip} ${statusInfo.class}`}
                              />

                              <Typography
                                variant="h6"
                                component="h2"
                                className={classes.connectionName}
                              >
                                {whatsApp.name || "-"}
                              </Typography>

                              {whatsApp.isDefault && (
                                <Chip
                                  label={i18n.t("connections.table.default")}
                                  size="small"
                                  className={classes.defaultChip}
                                />
                              )}

                              <Box className={classes.statsContainer}>
                                <Typography className={classes.sectionTitle}>
                                  {i18n.t("connections.table.session")}
                                </Typography>
                                <Grid container spacing={1}>
                                  <Grid
                                    item
                                    xs={12}
                                    className={classes.statItem}
                                  >
                                    <UpdateIcon className={classes.statIcon} />
                                    <Box>
                                      <Typography className={classes.statLabel}>
                                        {i18n.t("connections.table.lastUpdate")}
                                      </Typography>
                                      <Typography className={classes.statValue}>
                                        {format(
                                          parseISO(whatsApp.updatedAt),
                                          "dd/MM/yy HH:mm"
                                        )}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>

                              <Divider className={classes.divider} />

                              <Box>
                                <Typography className={classes.sectionTitle}>
                                  {i18n.t("connections.table.actions")}
                                </Typography>
                                <Box
                                  display="flex"
                                  flexWrap="wrap"
                                  style={{ gap: 4 }}
                                >
                                  <Tooltip title={i18n.t("common.edit")}>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleEditWhatsApp(whatsApp)
                                      }
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>

                                  {whatsApp.status === "CONNECTED" &&
                                    whatsApp.channel === "whatsapp" && (
                                      <Tooltip
                                        title={i18n.t(
                                          "connections.toolTips.privacy"
                                        )}
                                      >
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleOpenPrivacyWhatsApp(whatsApp)
                                          }
                                        >
                                          <Lock />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                  {false &&
                                    whatsApp.channel === "whatsapp" &&
                                    wavoipAvailable() && (
                                      <Tooltip title="Wavoip">
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleOpenWavoipModal(whatsApp)
                                          }
                                        >
                                          <img
                                            src={wavoipIcon}
                                            alt="Wavoip"
                                            style={{ width: 20, height: 20 }}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                  <Tooltip title={i18n.t("common.delete")}>
                                    <IconButton
                                      size="small"
                                      onClick={e => {
                                        handleOpenConfirmationModal(
                                          "delete",
                                          whatsApp.id
                                        );
                                      }}
                                    >
                                      <DeleteOutline />
                                    </IconButton>
                                  </Tooltip>

                                  {renderActionButtons(whatsApp)}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box className={classes.loadingContainer}>
                    <Typography variant="body1" color="textSecondary">
                      {i18n.t("connections.noConnections")}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </div>
        )}
      </Box>
      <Fab
        color="primary"
        className={classes.fab}
        onClick={handleOpenWhatsAppModal}
      >
        <AddIcon />
      </Fab>
    </MainContainer>
  );
};

export default Connections;
