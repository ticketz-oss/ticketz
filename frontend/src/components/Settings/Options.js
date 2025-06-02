import React, { useEffect, useState, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import useSettings from "../../hooks/useSettings";
import { i18nToast } from "../../helpers/i18nToast";
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { Delete } from "@material-ui/icons";
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
  
  groupTitle: {
    marginBottom: 0,
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
  const [outOfHoursAction, setOutOfHoursAction] = useState("pending");
  const [callType, setCallType] = useState("enabled");
  const [quickMessages, setQuickMessages] = useState("");
  const [allowSignup, setAllowSignup] = useState("disabled");
  const [chatbotAutoExit, setChatbotAutoExit] = useState("disabled");
  const [showNumericIcons, setShowNumericIcons] = useState("disabled");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");
  const [soundGroupNotifications, setSoundGroupNotifications] = useState("disabled");
  const [groupsTab, setGroupsTab] = useState("disabled");
  const [apiToken, setApiToken] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [audioTranscriptions, setAudioTranscriptions] = useState("disabled");
  const [uploadLimit, setUploadLimit] = useState("15");
  const [downloadLimit, setDownloadLimit] = useState("15");

  const [messageVisibility, setMessageVisibility] = useState("message");

  const [noQueueTimeout, setNoQueueTimeout] = useState("0");
  const [noQueueTimeoutAction, setNoQueueTimeoutAction] = useState("0");
  const [openTicketTimeout, setOpenTicketTimeout] = useState("0");
  const [openTicketTimeoutAction, setOpenTicketTimeoutAction] = useState("pending");
  const [chatbotTicketTimeout, setChatbotTicketTimeout] = useState("0");
  const [chatbotTicketTimeoutAction, setChatbotTicketTimeoutAction] = useState(0);

  const [queues, setQueues] = useState([]);
  const { findAll: findAllQueues } = useQueues();

  const [keepUserAndQueue, setKeepUserAndQueue] = useState("enabled");
  const [ratingsTimeout, setRatingsTimeout] = useState(false);
  const [autoReopenTimeout, setAutoReopenTimeout] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [tagsMode, setTagsMode] = useState("ticket");
  const [ticketAcceptedMessage, setTicketAcceptedMessage] = useState("");
  const [transferMessage, setTransferMessage] = useState("");

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
      
      const outOfHoursAction = settings.find((s) => s.key === "outOfHoursAction");
      setOutOfHoursAction(outOfHoursAction?.value || "pending");

      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }
      
      const soundGroupNotifications = settings.find((s) => s.key === "soundGroupNotifications");
      setSoundGroupNotifications(soundGroupNotifications?.value || "disabled");

      const groupsTab = settings.find((s) => s.key === "groupsTab");
      setGroupsTab(groupsTab?.value || "disabled");

      const chatbotAutoExit = settings.find((s) => s.key === "chatbotAutoExit");
      if (chatbotAutoExit) {
        setChatbotAutoExit(chatbotAutoExit.value);
      }

      const showNumericIcons = settings.find((s) => s.key === "showNumericIcons");
      setShowNumericIcons(showNumericIcons?.value || "disabled");

      const allowSignup = settings.find((s) => s.key === "allowSignup");
      if (allowSignup) {
        setAllowSignup(allowSignup.value);
      }
      const quickMessages = settings.find((s) => s.key === "quickMessages");
      setQuickMessages(quickMessages?.value || "individual");

      const keepUserAndQueue = settings.find((s) => s.key === "keepUserAndQueue");
      setKeepUserAndQueue(keepUserAndQueue?.value || "enabled");
        
      const apiToken = settings.find((s) => s.key === "apiToken");
      setApiToken(apiToken?.value || "");
      
      const openAiKey = settings.find((s) => s.key === "openAiKey");
      setOpenAiKey(openAiKey?.value || "");
      
      const aiProvider = settings.find((s) => s.key === "aiProvider");
      setAiProvider(aiProvider?.value || "openai");
      
      const audioTranscriptions = settings.find((s) => s.key === "audioTranscriptions");
      setAudioTranscriptions(audioTranscriptions?.value || "disabled");

      const uploadLimit = settings.find((s) => s.key === "uploadLimit");
      setUploadLimit(uploadLimit?.value || "");

      const downloadLimit = settings.find((s) => s.key === "downloadLimit");
      setDownloadLimit(downloadLimit?.value || "");
      
      const messageVisibility = settings.find((s) => s.key === "messageVisibility");
      setMessageVisibility(messageVisibility?.value || "message");

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
      
      const chatbotTicketTimeout = settings.find((s) => s.key === "chatbotTicketTimeout");
      setChatbotTicketTimeout(chatbotTicketTimeout?.value || "0");
      
      const chatbotTicketTimeoutAction = settings.find((s) => s.key === "chatbotTicketTimeoutAction");
      setChatbotTicketTimeoutAction(chatbotTicketTimeoutAction?.value || "0");

      const gracePeriod = settings.find((s) => s.key === "gracePeriod");
      setGracePeriod(gracePeriod?.value || 0);
      
      const tagsMode = settings.find((s) => s.key === "tagsMode");
      setTagsMode(tagsMode?.value || "ticket");

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
    await update({
      key: "userRating",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    await update({
      key: "scheduleType",
      value,
    });
    i18nToast.success("settings.success");
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    await update({
      key: "call",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleChatbotAutoExit(value) {
    setChatbotAutoExit(value);
    await update({
      key: "chatbotAutoExit",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleQuickMessages(value) {
    setQuickMessages(value);
    await update({
      key: "quickMessages",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleAllowSignup(value) {
    setAllowSignup(value);
    await update({
      key: "allowSignup",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleDownloadLimit(value) {
    setDownloadLimit(value);
    await update({
      key: "downloadLimit",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleRatingsTimeout(value) {
    setRatingsTimeout(value);
    await update({
      key: "ratingsTimeout",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleAutoReopenTimeout(value) {
    setAutoReopenTimeout(value);
    await update({
      key: "autoReopenTimeout",
      value,
    });
    i18nToast.success("settings.success");
  }

  async function handleSetting(key, value, setter = null) {
    if (setter) {
      setter(value);
    }
    await update({
      key,
      value,
    });
    i18nToast.success("settings.success");
  }

  async function generateApiToken() {
    const newToken = generateSecureToken(33);
    setApiToken(newToken);
    await update({
      key: "apiToken",
      value: newToken,
    });
    i18nToast.success("settings.success");
  }

  async function deleteApiToken() {
    setApiToken("");
    await update({
      key: "apiToken",
      value: "",
    });
    i18nToast.success("settings.success");
  }
  
  async function copyApiToken() {
    copyToClipboard(apiToken);
    i18nToast.success("settings.copiedToClipboard");
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    i18nToast.success("settings.success");
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }

  return (
    <>
      <Grid spacing={3} container>
        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.general")}</h2>
        </Grid>

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
          </FormControl>
        </Grid>
        
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="tags-mode-label">
              {i18n.t("settings.TagsMode.title")}
            </InputLabel>
            <Select
              labelId="tags-mode-label"
              value={tagsMode}
              onChange={async (e) => {
                handleSetting("tagsMode", e.target.value, setTagsMode);
              }}
            >
              <MenuItem value={"ticket"}>{i18n.t("settings.TagsMode.options.ticket")}</MenuItem>
              <MenuItem value={"contact"}>{i18n.t("settings.TagsMode.options.contact")}</MenuItem>
              <MenuItem value={"both"}>{i18n.t("settings.TagsMode.options.both")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="shownumericicons-label">
            {i18n.t("settings.ShowNumericEmoticons.title")}
            </InputLabel>
            <Select
              labelId="shownumericicons-label"
              value={showNumericIcons}
              onChange={async (e) => {
                handleSetting("showNumericIcons", e.target.value, setShowNumericIcons);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("common.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("common.enabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={12} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ticket-accepted-message-field"
              label={i18n.t("settings.ticketAcceptedMessage.title")}
              placeholder={i18n.t("settings.ticketAcceptedMessage.placeholder")}
              variant="standard"
              multiline
              rows={4}
              value={ticketAcceptedMessage}
              onChange={(e) => {
                setTicketAcceptedMessage(e.target.value);
              }}
              onBlur={(e) => {
                handleSetting("ticketAcceptedMessage", ticketAcceptedMessage);
              }}
            />
            <span>{i18n.t("settings.mustacheVariables.title")} {'{{firstname}} {{name}} {{user}} {{queue}}'}</span>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={12} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="transfer-message-field"
              label={i18n.t("settings.transferMessage.title")}
              placeholder={i18n.t("settings.transferMessage.placeholder")}
              variant="standard"
              multiline
              rows={4}
              value={transferMessage}
              onChange={(e) => {
                setTransferMessage(e.target.value);
              }}
              onBlur={(e) => {
                handleSetting("transferMessage", transferMessage);
              }}
            />
            <span>{i18n.t("settings.mustacheVariables.title")} {'{{firstname}} {{name}} {{user}} {{queue}}'}</span>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.timeouts")}</h2>
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
            <TextField
              id="chatbot-timeout-field"
              label={i18n.t("settings.chatbotTicketTimeout")}
              variant="standard"
              name="chatbotTicketTimeout"
              type="number"
              value={chatbotTicketTimeout}
              onChange={(e) => {
                setChatbotTicketTimeout(e.target.value);
              }}
              onBlur={async (_) => {
                await handleSetting("chatbotTicketTimeout", chatbotTicketTimeout);
              }}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-ticket-timeout-action-label">
              {i18n.t("settings.chatbotTicketTimeoutAction")}
            </InputLabel>
            <Select
              labelId="chatbot-ticket-timeout-action-label"
              value={chatbotTicketTimeoutAction}
              onChange={async (e) => {
                handleSetting("chatbotTicketTimeoutAction", e.target.value, setChatbotTicketTimeoutAction);
              }}
            >
              <MenuItem value={"0"}>{i18n.t("common.close")}</MenuItem>
              {queues.map((queue) => (
                <MenuItem key={queue.id} value={queue.id}>
                  {i18n.t("common.transferTo")} {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.officeHours")}</h2>
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
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="out-of-hours-action-label">
              {i18n.t("settings.outOfHoursAction.title")}
            </InputLabel>
            <Select
              labelId="out-of-hours-action-label"
              value={outOfHoursAction}
              onChange={async (e) => {
                await handleSetting("outOfHoursAction", e.target.value, setOutOfHoursAction);
              }}
            >
              <MenuItem value={"pending"}>{i18n.t("settings.outOfHoursAction.options.pending")}</MenuItem>
              <MenuItem value={"closed"}>{i18n.t("settings.outOfHoursAction.options.closed")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.groups")}</h2>
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
          </FormControl>
        </Grid>
        
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sound-group-notifications-label">
              {i18n.t("settings.soundGroupNotifications.title")}
            </InputLabel>
            <Select
              labelId="sound-group-notifications-label"
              value={soundGroupNotifications}
              onChange={async (e) => {
                await handleSetting("soundGroupNotifications", e.target.value, setSoundGroupNotifications);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.soundGroupNotifications.options.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.soundGroupNotifications.options.enabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="groups-tab-label">
              {i18n.t("settings.groupsTab.title")}
            </InputLabel>
            <Select
              labelId="groups-tab-label"
              value={groupsTab}
              disabled={CheckMsgIsGroup === "enabled"}
              onChange={async (e) => {
                await handleSetting("groupsTab", e.target.value, setGroupsTab);
              }}
            >
              <MenuItem value={"enabled"}>{i18n.t("settings.groupsTab.options.enabled")}</MenuItem>
              <MenuItem value={"disabled"}>{i18n.t("settings.groupsTab.options.disabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.confidenciality")}</h2>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="message-visibility-label">
              {i18n.t("settings.messageVisibility.title")}
            </InputLabel>
            <Select
              labelId="message-visibility-label"
              value={messageVisibility}
              onChange={async (e) => {
                await handleSetting("messageVisibility", e.target.value, setMessageVisibility);
              }}
            >
              <MenuItem value={"message"}>{i18n.t("settings.messageVisibility.options.respectMessageQueue")}</MenuItem>
              <MenuItem value={"ticket"}>{i18n.t("settings.messageVisibility.options.respectTicketQueue")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="keep-queue-and-user-label">
              {i18n.t("settings.keepQueueAndUser.title")}
            </InputLabel>
            <Select
              labelId="keep-queue-and-user-label"
              value={keepUserAndQueue}
              onChange={async (e) => {
                await handleSetting("keepUserAndQueue", e.target.value, setKeepUserAndQueue);
              }}
            >
              <MenuItem value={"enabled"}>{i18n.t("settings.keepQueueAndUser.options.enabled")}</MenuItem>
              <MenuItem value={"disabled"}>{i18n.t("settings.keepQueueAndUser.options.disabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.api")}</h2>
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

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.externalServices")}</h2>
        </Grid>
        
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ai-provider-label">
              {i18n.t("settings.AIProvider.title")}
            </InputLabel>
            <Select
              labelId="ai-provider-label"
              value={aiProvider}
              onChange={async (e) => {
                handleSetting("aiProvider", e.target.value, setAiProvider);
              }}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="groq">Groq</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid xs={12} sm={12} md={8} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="openai-key-field"
              label="AI Key"
              variant="standard"
              value={openAiKey}
              onChange={(e) => {
                setOpenAiKey(e.target.value);
              }}
              onBlur={async (_) => {
                await handleSetting("openAiKey", openAiKey);
              }}
            />
          </FormControl>
        </Grid>
        
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="audio-transcriptions-label">
              {i18n.t("settings.AudioTranscriptions.title")}
            </InputLabel>
            <Select
              labelId="audio-transcriptions-label"
              value={audioTranscriptions}
              onChange={async (e) => {
                handleSetting("audioTranscriptions", e.target.value, setAudioTranscriptions);
              }}
            >
              <MenuItem value="disabled">{i18n.t("common.disabled")}</MenuItem>
              <MenuItem value="enabled">{i18n.t("common.enabled")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid item xs={12}>
                <h2 className={classes.groupTitle}>{i18n.t("settings.group.serveradmin")}</h2>
              </Grid>
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
                </FormControl>
              </Grid>
              
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="upload-limit-field"
                    label={i18n.t("settings.FileUploadLimit.title")}
                    variant="standard"
                    name="uploadLimit"
                    value={uploadLimit}
                    onChange={(e) => {
                      setUploadLimit(e.target.value);
                    }}
                    onBlur={async (_) => {
                      await handleSetting("uploadLimit", uploadLimit);
                    }}
                  />
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
                    inputRef={downloadLimitInput}
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
      </Grid>
    </>
  );
}
