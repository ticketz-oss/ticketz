import React, { useEffect, useState, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import useSettings from "../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { Loop, Delete } from "@material-ui/icons";
import {
  IconButton,
  TextField
} from "@material-ui/core";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faGears } from '@fortawesome/free-solid-svg-icons';

import { generateSecureToken } from "../../helpers/generateSecureToken";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import useQueues from "../../hooks/useQueues";
import { i18n } from "../../translate/i18n.js";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e"
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },

  uploadInput: {
    display: "none",
  },
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [chatbotType, setChatbotType] = useState("");
  const [quickMessages, setQuickMessages] = useState("");
  const [allowSignup, setAllowSignup] = useState("disabled");
  const [chatbotAutoExit, setChatbotAutoExit] = useState("disabled");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");
  const [apiToken, setApiToken] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("15");
  const [transferToNewTicket, setTransferToNewTicket] = useState("connection");
  const [restrictTransferConnection, setRestrictTransferConnection] = useState("connection");
  const [noQueueTimeout, setNoQueueTimeout] = useState("0");
  const [noQueueTimeoutAction, setNoQueueTimeoutAction] = useState("0");
  const [openTicketTimeout, setOpenTicketTimeout] = useState("0");
  const [openTicketTimeoutAction, setOpenTicketTimeoutAction] = useState("pending");
  const [queues, setQueues] = useState([]);
  const { findAll: findAllQueues } = useQueues();

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
  const [loadingAllowSignup, setLoadingAllowSignup] = useState(false);
  const [loadingChatbotAutoExit, setLoadingChatbotAutoExit] = useState(false);
  const [loadingCheckMsgIsGroup, setCheckMsgIsGroup] = useState(false);
  const [loadingApiToken, setLoadingApiToken] = useState(false);
  const [loadingDownloadLimit, setLoadingDownloadLimit] = useState(false);
  const [ratingsTimeout, setRatingsTimeout] = useState(false);
  const [autoReopenTimeout, setAutoReopenTimeout] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [showPrevTickets, setShowPrevTickets] = useState("disabled");
  const [closedTicketVisibility, setClosedTicketVisibility] = useState("User");
  const [ticketAcceptedMessage, setTicketAcceptedMessage] = useState("");
  const [transferMessage, setTransferMessage] = useState("");

  const ticketAcceptedMessageRef = useRef(null);
  const transferMessageRef = useRef(null);

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const downloadLimitInput = useRef(null);

  const { update } = useSettings();

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    getCurrentUserInfo().then(
      (u) => {
        setCurrentUser(u);
      }
    );

    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }
      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      }
      const chatbotAutoExit = settings.find((s) => s.key === "chatbotAutoExit");
      if (chatbotAutoExit) {
        setChatbotAutoExit(chatbotAutoExit.value);
      }
      const allowSignup = settings.find((s) => s.key === "allowSignup");
      if (allowSignup) {
        setAllowSignup(allowSignup.value);
      }
      const quickMessages = settings.find((s) => s.key === "quickMessages");
      setQuickMessages(quickMessages?.value || "individual");

      const apiToken = settings.find((s) => s.key === "apiToken");
      setApiToken(apiToken?.value || "");

      const downloadLimit = settings.find((s) => s.key === "downloadLimit");
      setDownloadLimit(downloadLimit?.value || "");

      const restrictTransferConnection = settings.find((s) => s.key === "restrictTransferConnection");
      setRestrictTransferConnection(restrictTransferConnection?.value || "connection");

      const transferToNewTicket = settings.find((s) => s.key === "transferToNewTicket");
      setTransferToNewTicket(transferToNewTicket?.value || "connection");

      const ratingsTimeout = settings.find((s) => s.key === "ratingsTimeout");
      setRatingsTimeout(ratingsTimeout?.value || "5");

      const autoReopenTimeout = settings.find((s) => s.key === "autoReopenTimeout");
      setAutoReopenTimeout(autoReopenTimeout?.value || "0");

      const noQueueTimeout = settings.find((s) => s.key === "noQueueTimeout");
      setNoQueueTimeout(noQueueTimeout?.value || "0");

      const noQueueTimeoutAction = settings.find((s) => s.key === "noQueueTimeoutAction");
      setNoQueueTimeoutAction(noQueueTimeoutAction?.value || "0");

      const openTicketTimeout = settings.find((s) => s.key === "openTicketTimeout");
      setOpenTicketTimeout(openTicketTimeout?.value || "0");

      const openTicketTimeoutAction = settings.find((s) => s.key === "openTicketTimeoutAction");
      setOpenTicketTimeoutAction(openTicketTimeoutAction?.value || "pending");

      const gracePeriod = settings.find((s) => s.key === "gracePeriod");
      setGracePeriod(gracePeriod?.value || 0);

      const closedTicketVisibility = settings.find((s) => s.key === "closedTicketVisibility");
      setClosedTicketVisibility(closedTicketVisibility?.value || "User");

      const showPrevTickets = settings.find((s) => s.key === "showPrevTickets");
      setShowPrevTickets(showPrevTickets?.value || "disabled");

      const ticketAcceptedMessage = settings.find((s) => s.key === "ticketAcceptedMessage");
      setTicketAcceptedMessage(ticketAcceptedMessage?.value || "");

      const transferMessage = settings.find((s) => s.key === "transferMessage");
      setTransferMessage(transferMessage?.value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);


  useEffect(() => {
    if (isMounted.current) {
      const loadQueues = async () => {
        const list = await findAllQueues();
        setQueues(list);
      };
      loadQueues();
    }
  }, []);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingUserRating(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    //toast.success("Oraçãpeo atualizada com sucesso.");
    toast.success('Operação atualizada com sucesso.', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: "light",
    });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingCallType(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingChatbotType(false);
  }

  async function handleChatbotAutoExit(value) {
    setChatbotAutoExit(value);
    setLoadingChatbotAutoExit(true);
    await update({
      key: "chatbotAutoExit",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingChatbotAutoExit(false);
  }

  async function handleQuickMessages(value) {
    setQuickMessages(value);
    setLoadingQuickMessages(true);
    await update({
      key: "quickMessages",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingQuickMessages(false);
  }

  async function handleTransferToNewTicket(value) {
    setTransferToNewTicket(value);
    await update({
      key: "transferToNewTicket",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleRestrictTransferConnection(value) {
    setRestrictTransferConnection(value);
    await update({
      key: "restrictTransferConnection",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleAllowSignup(value) {
    setAllowSignup(value);
    setLoadingAllowSignup(true);
    await update({
      key: "allowSignup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingAllowSignup(false);
  }

  async function handleDownloadLimit(value) {
    setDownloadLimit(value);
    setLoadingDownloadLimit(true);
    await update({
      key: "downloadLimit",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingDownloadLimit(false);
  }

  async function handleRatingsTimeout(value) {
    setRatingsTimeout(value);
    await update({
      key: "ratingsTimeout",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleAutoReopenTimeout(value) {
    setAutoReopenTimeout(value);
    await update({
      key: "autoReopenTimeout",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleSetting(key, value, setter = null) {
    if (setter) {
      setter(value);
    }
    await update({
      key,
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function generateApiToken() {
    const newToken = generateSecureToken(32);
    setApiToken(newToken);
    setLoadingApiToken(true);
    await update({
      key: "apiToken",
      value: newToken,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingApiToken(false);
  }

  async function deleteApiToken() {
    setApiToken("");
    setLoadingApiToken(true);
    await update({
      key: "apiToken",
      value: "",
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingApiToken(false);
  }

  async function copyApiToken() {
    copyToClipboard(apiToken);
    toast.success("Token copied to clipboard");
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    setCheckMsgIsGroup(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setCheckMsgIsGroup(false);
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }

  return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
                    <Title>Configurações Gerais</Title>
                </Grid> */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ratings-label">{i18n.t("settings.validations.title")}</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.validations.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.validations.options.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ratings-timeout-field"
              label="Timeout para avaliação (minutos)"
              variant="standard"
              name="ratingsTimeout"
              type="number"
              value={ratingsTimeout}
              onChange={(e) => {
                setRatingsTimeout(e.target.value);
              }}
              onBlur={async (_) => {
                await handleRatingsTimeout(ratingsTimeout);
              }}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="autoreopen-timeout-field"
              label="Timeout para reabertura automática (minutos)"
              variant="standard"
              name="autoReopenTimeout"
              type="number"
              value={autoReopenTimeout}
              onChange={(e) => {
                setAutoReopenTimeout(e.target.value);
              }}
              onBlur={async (_) => {
                await handleAutoReopenTimeout(autoReopenTimeout);
              }}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="noqueue-timeout-field"
              label="Timeout para ticket sem fila (minutos)"
              variant="standard"
              name="noQueueTimeout"
              type="number"
              value={noQueueTimeout}
              onChange={(e) => {
                setNoQueueTimeout(e.target.value);
              }}
              onBlur={async (_) => {
                await handleSetting("noQueueTimeout", noQueueTimeout);
              }}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="noqueue-timeout-action-label">
              Ação para timeout de ticket sem fila
            </InputLabel>
            <Select
              labelId="open-timeout-action-label"
              value={noQueueTimeoutAction}
              onChange={async (e) => {
                handleSetting("noQueueTimeoutAction", e.target.value, setNoQueueTimeoutAction);
              }}
            >
              <MenuItem value={"0"}>Fechar</MenuItem>
              {queues.map((queue) => (
                <MenuItem key={queue.id} value={queue.id}>
                  Transferir para {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>


        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="openticket-timeout-field"
              label="Timeout para ticket em atendimento (minutos)"
              variant="standard"
              name="openTicketTimeout"
              type="number"
              value={openTicketTimeout}
              onChange={(e) => {
                setOpenTicketTimeout(e.target.value);
              }}
              onBlur={async (_) => {
                await handleSetting("openTicketTimeout", openTicketTimeout);
              }}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="opentimeout-action-label">
              Ação para timeout de ticket aberto
            </InputLabel>
            <Select
              labelId="open-timeout-action-label"
              value={openTicketTimeoutAction}
              onChange={async (e) => {
                handleSetting("openTicketTimeoutAction", e.target.value, setOpenTicketTimeoutAction);
              }}
            >
              <MenuItem value={"pending"}>Retornar para a fila</MenuItem>
              <MenuItem value={"closed"}>Fechar atendimento</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="schedule-type-label">
              {i18n.t("settings.OfficeManagement.title")}
            </InputLabel>
            <Select
              labelId="schedule-type-label"
              value={scheduleType}
              onChange={async (e) => {
                handleScheduleType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.OfficeManagement.options.disabled")}</MenuItem>
              <MenuItem value={"queue"}>{i18n.t("settings.OfficeManagement.options.ManagementByDepartment")}</MenuItem>
              <MenuItem value={"company"}>{i18n.t("settings.OfficeManagement.options.ManagementByCompany")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              {i18n.t("settings.IgnoreGroupMessages.title")}
            </InputLabel>
            <Select
              labelId="group-type-label"
              value={CheckMsgIsGroup}
              onChange={async (e) => {
                handleGroupType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.IgnoreGroupMessages.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.IgnoreGroupMessages.options.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="call-type-label">
              {i18n.t("settings.VoiceAndVideoCalls.title")}
            </InputLabel>
            <Select
              labelId="call-type-label"
              value={callType}
              onChange={async (e) => {
                handleCallType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.VoiceAndVideoCalls.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.VoiceAndVideoCalls.options.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingCallType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-type-label">
              Tipo Chatbot
            </InputLabel>
            <Select
              labelId="chatbot-type-label"
              value={chatbotType}
              onChange={async (e) => {
                handleChatbotType(e.target.value);
              }}
            >
              <MenuItem value={"text"}>Texto</MenuItem>
            </Select>
            <FormHelperText>
              {loadingChatbotType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              {i18n.t("settings.AutomaticChatbotOutput.title")}
            </InputLabel>
            <Select
              labelId="chatbot-autoexit"
              value={chatbotAutoExit}
              onChange={async (e) => {
                handleChatbotAutoExit(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.AutomaticChatbotOutput.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.AutomaticChatbotOutput.options.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingChatbotAutoExit && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="quickmessages-label">
              {i18n.t("settings.QuickMessages.title")}
            </InputLabel>
            <Select
              labelId="quickmessages-label"
              value={quickMessages}
              onChange={async (e) => {
                handleQuickMessages(e.target.value);
              }}
            >
              <MenuItem value={"company"}>{i18n.t("settings.QuickMessages.options.enabled")}</MenuItem>
              <MenuItem value={"individual"}>{i18n.t("settings.QuickMessages.options.disabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingQuickMessages && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="connrestricttoqueues-label">
              Transferência força troca de conexão
            </InputLabel>
            <Select
              labelId="connrestricttoqueues-label"
              value={restrictTransferConnection}
              onChange={async (e) => {
                handleRestrictTransferConnection(e.target.value);
              }}
            >
              <MenuItem value={"connection"}>Configurada por conexão</MenuItem>
              <MenuItem value={"enabled"}>Ativada</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="transfernewticket-label">
              Transferência como novo ticket
            </InputLabel>
            <Select
              labelId="transfernewticket-label"
              value={transferToNewTicket}
              onChange={async (e) => {
                handleTransferToNewTicket(e.target.value);
              }}
            >
              <MenuItem value={"connection"}>Configurada por conexão</MenuItem>
              <MenuItem value={"enabled"}>Ativada</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="show-prev-tickets-label">
              {i18n.t("settings.showPrevTickets.title")}
            </InputLabel>
            <Select
              labelId="show-prev-tickets-label"
              value={showPrevTickets}
              onChange={async (e) => {
                handleSetting("showPrevTickets", e.target.value, setShowPrevTickets);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.showPrevTickets.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.showPrevTickets.options.enabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="closed-ticket-visibility-label">
              {i18n.t("settings.closedTicketVisibility.title")}
            </InputLabel>
            <Select
              labelId="closed-ticket-visibility-label"
              value={closedTicketVisibility}
              onChange={async (e) => {
                handleSetting("closedTicketVisibility", e.target.value, setClosedTicketVisibility);
              }}
            >
              <MenuItem value={"Company"}>{i18n.t("settings.closedTicketVisibility.options.company")}</MenuItem>
              <MenuItem value={"Queue"}>{i18n.t("settings.closedTicketVisibility.options.queue")}</MenuItem>
              <MenuItem value={"User"}>{i18n.t("settings.closedTicketVisibility.options.user")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="primary-color-light-field"
              label="API Token"
              variant="standard"
              value={apiToken}
              InputProps={{
                endAdornment: (
                  <>
                    {apiToken &&
                      <>
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => {
                            copyApiToken();
                          }
                          }
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => {
                            deleteApiToken();
                          }
                          }
                        >
                          <Delete />
                        </IconButton>
                      </>
                    }
                    {
                      !apiToken &&
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => {
                          generateApiToken();
                        }
                        }
                      >
                        <FontAwesomeIcon icon={faGears} />
                      </IconButton>
                    }
                  </>
                ),
              }}
            />
          </FormControl>
        </Grid>

        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id="group-type-label">
                    {i18n.t("settings.AllowRegistration.title")}
                  </InputLabel>
                  <Select
                    labelId="allow-signup"
                    value={allowSignup}
                    onChange={async (e) => {
                      handleAllowSignup(e.target.value);
                    }}
                  >
                    <MenuItem value={"disabled"}>{i18n.t("settings.AllowRegistration.options.disabled")}</MenuItem>
                    <MenuItem value={"enabled"}>{i18n.t("settings.AllowRegistration.options.enabled")}</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingAllowSignup && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>


              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="appname-field"
                    label={i18n.t("settings.FileDownloadLimit.title")}
                    variant="standard"
                    name="appName"
                    value={downloadLimit}
                    onChange={(e) => {
                      setDownloadLimit(e.target.value);
                    }}
                    onBlur={async (_) => {
                      await handleDownloadLimit(downloadLimit);
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="grace-period-field"
                    label={i18n.t("settings.GracePeriod.title")}
                    variant="standard"
                    name="gracePeriod"
                    type="number"
                    value={gracePeriod}
                    onChange={(e) => {
                      setGracePeriod(e.target.value);
                    }}
                    onBlur={async (_) => {
                      await handleSetting("gracePeriod", gracePeriod);
                    }}
                  />
                </FormControl>
              </Grid>

            </>

          )}
        />

        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ticket-accepted-message-field"
              label={i18n.t("settings.ticketAcceptedMessage.title")}
              placeholder={i18n.t("settings.ticketAcceptedMessage.placeholder")}
              variant="standard"
              multiline
              rows={4}
              ref={ticketAcceptedMessageRef}
              value={ticketAcceptedMessage}
              onChange={(e) => {
                setTicketAcceptedMessage(e.target.value);
              }}
              onBlur={(e) => {
                handleSetting("ticketAcceptedMessage", ticketAcceptedMessage);
              }}
            />
            <span>{i18n.t("settings.mustacheVariables.title")}</span>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="transfer-message-field"
              label={i18n.t("settings.transferMessage.title")}
              placeholder={i18n.t("settings.transferMessage.placeholder")}
              variant="standard"
              multiline
              rows={4}
              ref={transferMessageRef}
              value={transferMessage}
              onChange={(e) => {
                setTransferMessage(e.target.value);
              }}
              onBlur={(e) => {
                handleSetting("transferMessage", transferMessage);
              }}
            />
            <span>{i18n.t("settings.mustacheVariables.title")}</span>
          </FormControl>
        </Grid>

      </Grid>
    </>
  );
}
