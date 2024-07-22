import React, { useEffect, useState } from "react";

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

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
  const [loadingAllowSignup, setLoadingAllowSignup] = useState(false);
  const [loadingChatbotAutoExit, setLoadingChatbotAutoExit] = useState(false);
  const [loadingCheckMsgIsGroup, setCheckMsgIsGroup] = useState(false);
  const [loadingApiToken, setLoadingApiToken] = useState(false);
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

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
            <InputLabel id="ratings-label">Avaliações</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitadas</MenuItem>
              <MenuItem value={"enabled"}>Habilitadas</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="schedule-type-label">
              Gerenciamento de Expediente
            </InputLabel>
            <Select
              labelId="schedule-type-label"
              value={scheduleType}
              onChange={async (e) => {
                handleScheduleType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"queue"}>Gerenciamento Por Fila</MenuItem>
              <MenuItem value={"company"}>Gerenciamento Por Empresa</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              Ignorar Mensagens de Grupos
            </InputLabel>
            <Select
              labelId="group-type-label"
              value={CheckMsgIsGroup}
              onChange={async (e) => {
                handleGroupType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desativado</MenuItem>
              <MenuItem value={"enabled"}>Ativado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="call-type-label">
              Chamadas de Voz e Vídeo
            </InputLabel>
            <Select
              labelId="call-type-label"
              value={callType}
              onChange={async (e) => {
                handleCallType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Informar indisponibilidade</MenuItem>
              <MenuItem value={"enabled"}>Ignorar</MenuItem>
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
              Saída automática de chatbot
            </InputLabel>
            <Select
              labelId="chatbot-autoexit"
              value={chatbotAutoExit}
              onChange={async (e) => {
                handleChatbotAutoExit(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desativado</MenuItem>
              <MenuItem value={"enabled"}>Ativado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingChatbotAutoExit && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="quickmessages-label">
              Mensagens Rápidas
            </InputLabel>
            <Select
              labelId="quickmessages-label"
              value={quickMessages}
              onChange={async (e) => {
                handleQuickMessages(e.target.value);
              }}
            >
              <MenuItem value={"company"}>Por empresa</MenuItem>
              <MenuItem value={"individual"}>Por usuário</MenuItem>
            </Select>
            <FormHelperText>
              {loadingQuickMessages && "Atualizando..."}
            </FormHelperText>
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
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id="group-type-label">
                    Permitir cadastro
                  </InputLabel>
                  <Select
                    labelId="allow-signup"
                    value={allowSignup}
                    onChange={async (e) => {
                      handleAllowSignup(e.target.value);
                    }}
                  >
                    <MenuItem value={"disabled"}>Desativado</MenuItem>
                    <MenuItem value={"enabled"}>Ativado</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingAllowSignup && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
          )}
        />
      </Grid>
    </>
  );
}
