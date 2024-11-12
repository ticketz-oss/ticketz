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
  const [groupsTab, setGroupsTab] = useState("disabled");
  const [apiToken, setApiToken] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("15");
  
  const [messageVisibility, setMessageVisibility] = useState("Respect Message Queue");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
  const [loadingAllowSignup, setLoadingAllowSignup] = useState(false);
  const [loadingChatbotAutoExit, setLoadingChatbotAutoExit] = useState(false);
  const [loadingCheckMsgIsGroup, setCheckMsgIsGroup] = useState(false);
  const [keepQueueAndUser, setKeepQueueAndUser] = useState("enabled");
  const [loadingApiToken, setLoadingApiToken] = useState(false);
  const [loadingDownloadLimit, setLoadingDownloadLimit] = useState(false);
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const downloadLimitInput = useRef(null);

  const { update } = useSettings();

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

      const groupsTab = settings.find((s) => s.key === "groupsTab");
      setGroupsTab(groupsTab?.value || "disabled");

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

      const keepQueueAndUser = settings.find((s) => s.key === "keepQueueAndUser");
      setKeepQueueAndUser(keepQueueAndUser?.value || "enabled");
        
      const apiToken = settings.find((s) => s.key === "apiToken");
      setApiToken(apiToken?.value || "");

      const downloadLimit = settings.find((s) => s.key === "downloadLimit");
      setDownloadLimit(downloadLimit?.value || "");
      
      const messageVisibility = settings.find((s) => s.key === "messageVisibility");
      setMessageVisibility(messageVisibility?.value || "message");

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

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
              value={keepQueueAndUser}
              onChange={async (e) => {
                await handleSetting("keepQueueAndUser", e.target.value, setKeepQueueAndUser);
              }}
            >
              <MenuItem value={"enabled"}>{i18n.t("settings.keepQueueAndUser.options.enabled")}</MenuItem>
              <MenuItem value={"disabled"}>{i18n.t("settings.keepQueueAndUser.options.disabled")}</MenuItem>
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
            </>

          )}
        />
      </Grid>
    </>
  );
}
