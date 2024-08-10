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


import { Typography, Button } from "@material-ui/core";
import MercadoPagoCreditCard from "../MerdcadoPagoCreditCard";
import useTicketzProSubscribe from "../../hooks/useTicketzProSubscribe";
import moment from "moment/moment";
import 'moment/locale/pt';
import useTicketzProStatus from "../../hooks/useTicketzProStatus";
import useTicketzProCheck from "../../hooks/useTicketzProCheck";

moment.locale("pt-br");

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
  
  button: {
    marginLeft: "12px",
    position: "relative",
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
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const downloadLimitInput = useRef(null);

  const { ticketzProSubscribe } = useTicketzProSubscribe();
  const { ticketzProStatus } = useTicketzProStatus();
  const { ticketzProCheck } = useTicketzProCheck();
  const [ticketzProKey, setTicketzProKey] = useState("");
  const ticketzProKeyInput = useRef(null);
  const [showTicketzProKey, setShowTicketzProKey] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [subscribeError, setSubscribeError] = useState("");
  const [proStatus, setProStatus] = useState(null);

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

      const downloadLimit = settings.find((s) => s.key === "downloadLimit");
      setDownloadLimit(downloadLimit?.value || "");
      
      const ticketzProKey = settings.find((s) => s.key === "ticketzProKey");
      setTicketzProKey(ticketzProKey?.value || "");
      
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

  async function handleTicketzProKey(value) {
    setTicketzProKey(value);
    await update({
      key: "ticketzProKey",
      value,
    });
    if (value) {
      ticketzProCheck().then(
        _ => {
          ticketzProStatus().then(
            ticketzPro => {
              setProStatus(ticketzPro.status);
            }
          )
        }
      );
    } else {
      setProStatus(null);
    }
    toast.success("Operação atualizada com sucesso.");
  }

  function formCallback(cardToken) {
    setShowCardForm(false);

    ticketzProSubscribe({
      emailAddress,
      cardToken: cardToken?.id,
    }).then(
      result => {
        setProStatus(result);
        if (result.id) {
          setTicketzProKey(result.id);
          setShowCardForm(false);
          setShowTicketzProKey(false);
        }
      },
      error => setSubscribeError(error.message || "Erro desconhecido")
    );
  }
  
  useEffect(() => {
    async function fetchData() {
      const ticketzPro = await ticketzProStatus();
      setProStatus(ticketzPro.status);
    }
    if (ticketzProKey) {
      fetchData();
    }
  }, []);

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
            <>
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


              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="appname-field"
                    label="Limite de Download de arquivos (MB)"
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
      
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <Grid spacing={3} container style={{ paddingTop: "15px" }}>
            <Grid xs={12} item>
              <Typography variant="h5" color="primary">
                Ticketz PRO
              </Typography>
            </Grid>
            {
            !ticketzProKey &&
              <Grid xs={12} sm={12} md={12} className={classes.buttonGrid}>
                {!showCardForm &&
                  <Button
                    className={classes.button}
                    variant="contained"
                    color="primary"
                    onClick={
                      () => {
                        setShowCardForm(true);
                        setShowTicketzProKey(false);
                      }
                    }>
                    Assinar o Ticketz PRO
                  </Button>
                }
                {!showTicketzProKey &&
                  <Button
                    className={classes.button}
                    variant="contained"
                    color="primary"
                    onClick={
                      () => {
                        setShowTicketzProKey(true);
                        setShowCardForm(false);
                      }
                    }>
                    Código de Ativação
                  </Button>
                }
              </Grid>
            }

            {
            ticketzProKey &&
              <Grid xs={12} sm={12} md={12} className={classes.buttonGrid}>
                <Button
                  className={classes.button}
                  variant="contained"
                  color="secondary"
                  onClick={
                    () => {
                      setShowCardForm(false);
                      handleTicketzProKey("");
                      setProStatus(null);
                    }
                  }>
                  Resetar Licença
                </Button>
              </Grid>
            }

            { showTicketzProKey &&
            <Grid xs={12} sm={12} md={6} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="ticketzprokey-field"
                  label="Código de Ativação"
                  variant="standard"
                  name="ticketzProKey"
                  value={ticketzProKey}
                  inputRef={ticketzProKeyInput}
                  onBlur={async (_) => {
                    await handleTicketzProKey(ticketzProKey);
                  }}
                />
              </FormControl>
            </Grid>
            }
            
            {
              showCardForm &&
              <>
              <Grid xs={12} sm={12} md={6} item>
                  <Typography component="h2" variant="h6">
                    Assinatura: R$ 199/mês
                  </Typography>

                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="email-field"
                    label="Endereço de e-mail"
                    variant="standard"
                    name="emailAddress"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={12} item>
                <MercadoPagoCreditCard callback={formCallback}/>
              </Grid>
              </>
            }
            {
              subscribeError &&
              <Grid xs={12} item>
                <Typography variant="h5" color="error">
                  { subscribeError }
                </Typography>
              </Grid>
            }

            {
              proStatus &&
              <Typography component="h2" variant="h6">
                Status da assinatura:&nbsp;
                {
                  proStatus?.success ?
                    (proStatus?.subscriptionData?.next_payment_date ? "Válida até " + moment(proStatus.subscriptionData.next_payment_date).format("LL") : "OK")
                    :
                    "Erro: " + proStatus?.message
                }
              </Typography>
            }            
            
          </Grid>
        )}
      />
    </>
  );
}
