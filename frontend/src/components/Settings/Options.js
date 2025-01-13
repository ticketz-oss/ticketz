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
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");
  const [soundGroupNotifications, setSoundGroupNotifications] = useState("disabled");
  const [groupsTab, setGroupsTab] = useState("disabled");
  const [apiToken, setApiToken] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("15");
  
  const [messageVisibility, setMessageVisibility] = useState("Respect Message Queue");

  const [keepQueueAndUser, setKeepQueueAndUser] = useState("enabled");
  const { getCurrentUserInfo } = useAuth();
  const [autoReopenTimeout, setAutoReopenTimeout] = useState(false);
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

      const autoReopenTimeout = settings.find((s) => s.key === "autoReopenTimeout");
      setAutoReopenTimeout(autoReopenTimeout?.value || "0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    await update({
      key: "userRating",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
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
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleChatbotAutoExit(value) {
    setChatbotAutoExit(value);
    await update({
      key: "chatbotAutoExit",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleQuickMessages(value) {
    setQuickMessages(value);
    await update({
      key: "quickMessages",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleAllowSignup(value) {
    setAllowSignup(value);
    await update({
      key: "allowSignup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleDownloadLimit(value) {
    setDownloadLimit(value);
    await update({
      key: "downloadLimit",
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
    await update({
      key: "apiToken",
      value: newToken,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  async function deleteApiToken() {
    setApiToken("");
    await update({
      key: "apiToken",
      value: "",
    });
    toast.success("Operação atualizada com sucesso.");
  }
  
  async function copyApiToken() {
    copyToClipboard(apiToken);
    toast.success("Token copied to clipboard");
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
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
                
        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.timeouts")}</h2>
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
