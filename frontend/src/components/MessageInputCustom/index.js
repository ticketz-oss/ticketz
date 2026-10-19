import React, {
  useCallback,
  useState,
  useEffect,
  useContext,
  useRef
} from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";

import {
  Code,
  FormatListNumbered,
  FormatListBulleted,
  FormatQuote
} from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import {
  Paperclip as AttachFileIcon,
  Send as SendIcon,
  Mic as MicIcon
} from "../AnimatedIcon";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CameraAltIcon from "@material-ui/icons/CameraAlt";
import {
  FormControlLabel,
  Switch,
  Tooltip,
  InputAdornment,
  Typography,
  Popper
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { isString, isEmpty, isObject, has } from "lodash";

import { i18n } from "../../translate/i18n";
import useWritingAssistance from "../../hooks/useWritingAssistance";
import TemplateMessageModal from "../TemplateMessageModal";
import { isOfficialApiConnection } from "../../helpers/officialApiRestriction";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";

import useQuickMessages from "../../hooks/useQuickMessages";

import LinearWithValueLabel from "./ProgressBarCustom";
import { prepareMediaUpload } from "./prepareMediaUpload";
import useRascunhoDoTicket from "./useRascunhoDoTicket";
import WhatsMarked from "react-whatsmarked";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature } from "@fortawesome/free-solid-svg-icons";
import { isMobile } from "../../helpers/isMobile";
import { SocketContext } from "../../context/Socket/SocketContext";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles(theme => ({
  mainWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: `1px solid ${theme.palette.divider}`
  },

  serviceWindowBar: {
    width: "calc(100% - 24px)",
    margin: "12px 12px 0 12px",
    padding: theme.spacing(1, 1.5),
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    backgroundColor: theme.palette.action.hover
  },

  serviceWindowText: {
    flex: 1
  },

  newMessageBox: {
    width: "calc(100% - 24px)",
    margin: "12px",
    display: "flex",
    flexWrap: "wrap",
    padding: "6px",
    alignItems: "center",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    "& > .MuiIconButton-root": { padding: 8 },
    "& > label .MuiIconButton-root": { padding: 8 },
    "& > .MuiIconButton-root:last-child": { marginLeft: "auto" }
  },
  messageInputWrapper: {
    padding: "8px 4px",
    minWidth: 0,
    minHeight: 64,
    order: -1,
    flexBasis: "100%",
    display: "flex"
  },

  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none"
  },

  cameraIcon: {
    color: theme.isStardew ? theme.stardew.muted : "grey"
  },

  sendMessageIcons: {
    color: theme.isStardew ? theme.stardew.muted : "grey"
  },

  uploadInput: {
    display: "none"
  },

  viewMediaInputWrapper: {
    display: "flex",
    width: "calc(100% - 24px)",
    margin: "12px 12px 0 12px",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    backgroundColor: theme.palette.action.hover
  },

  selectedMediaNames: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },

  selectedMediaProgress: {
    flex: 1,
    minWidth: 0
  },

  emojiBox: {
    position: "absolute",
    bottom: 150,
    zIndex: 5,
    width: 40,
    borderTop: "1px solid #e8e8e8"
  },

  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12
  },

  audioLoading: {
    color: green[500],
    opacity: "70%"
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle"
  },

  cancelAudioIcon: {
    color: "red"
  },

  sendAudioIcon: {
    color: "green"
  },

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7
  },

  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative"
  },

  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden"
  },

  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: theme.isStardew ? theme.stardew.green : "#35cd96"
  },

  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: theme.isStardew ? theme.stardew.green : "#6bcbef"
  },

  messageContactName: {
    display: "flex",
    color: theme.isStardew ? theme.stardew.green : "#6bcbef",
    fontWeight: 500
  },

  iconSwitch: {
    color: props => (props.value ? theme.palette.primary.main : "gray"),
    width: 36,
    height: 36
  },

  formatMenu: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 30,
    boxShadow: theme.shadows[2],
    padding: "4px 8px",
    display: "flex",
    alignItems: "center"
  }
}));

const EmojiOptions = props => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  useEffect(() => {
    if (!showEmoji) return undefined;
    const fechar = evento => {
      if (evento.key !== "Escape" || evento.isComposing) return;
      evento.preventDefault();
      setShowEmoji(false);
    };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [showEmoji, setShowEmoji]);
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={e => setShowEmoji(prevState => !prevState)}
      >
        <MoodIcon className={classes.sendMessageIcons} />
      </IconButton>
      {showEmoji ? (
        <div className={classes.emojiBox}>
          <Picker
            perLine={16}
            showPreview={false}
            showSkinTones={false}
            onSelect={handleAddEmoji}
          />
        </div>
      ) : null}
    </>
  );
};

const SignSwitch = props => {
  const { setSignMessage, signMessage } = props;
  const classes = useStyles({ signMessage });

  return (
    <IconButton
      onClick={() => setSignMessage(!signMessage)}
      className={classes.signatureIcon}
    >
      <FontAwesomeIcon icon={faSignature} />
    </IconButton>
  );
};

const IconSwitch = props => {
  const { setter, value, icon, tooltip } = props;
  const classes = useStyles({ value });

  return (
    <Tooltip title={tooltip}>
      <IconButton onClick={() => setter(!value)} className={classes.iconSwitch}>
        <FontAwesomeIcon icon={icon} />
      </IconButton>
    </Tooltip>
  );
};

const FileInput = props => {
  const { handleChangeMedias, disableOption } = props;
  const classes = useStyles();
  return (
    <>
      <input
        multiple
        type="file"
        id="upload-button"
        disabled={disableOption}
        className={classes.uploadInput}
        onChange={handleChangeMedias}
      />
      <label htmlFor="upload-button">
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption}
        >
          <AttachFileIcon className={classes.sendMessageIcons} />
        </IconButton>
      </label>
    </>
  );
};

const ActionButtons = props => {
  const {
    inputMessage,
    hasMedia,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
    disableOption
  } = props;
  const classes = useStyles();
  if (inputMessage || hasMedia) {
    return (
      <IconButton
        aria-label="sendMessage"
        component="span"
        onClick={handleSendMessage}
        disabled={disableOption}
      >
        <SendIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  } else if (recording) {
    return (
      <div className={classes.recorderWrapper}>
        <IconButton
          aria-label="cancelRecording"
          component="span"
          fontSize="large"
          disabled={disableOption}
          onClick={handleCancelAudio}
        >
          <HighlightOffIcon className={classes.cancelAudioIcon} />
        </IconButton>
        {loading ? (
          <div>
            <CircularProgress className={classes.audioLoading} />
          </div>
        ) : (
          <RecordingTimer />
        )}

        <IconButton
          aria-label="sendRecordedAudio"
          component="span"
          onClick={handleUploadAudio}
          disabled={disableOption}
        >
          <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
        </IconButton>
      </div>
    );
  } else {
    return (
      <IconButton
        aria-label="showRecorder"
        component="span"
        disabled={disableOption}
        onClick={handleStartRecording}
      >
        <MicIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  }
};

function UpwardPopper(props) {
  return (
    <Popper
      {...props}
      placement="top-start" // force always upwards
      modifiers={{
        flip: { enabled: false }, // disable flipping
        preventOverflow: { enabled: false } // disable overflow adjustment
      }}
    />
  );
}

const CustomInput = props => {
  const writingAssistance = useWritingAssistance();
  const {
    compact,
    loading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    handleChangeMedias,
    handlePresenceUpdate,
    disableOption
  } = props;
  const classes = useStyles();
  const [quickMessages, setQuickMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const { user } = useContext(AuthContext);

  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    const handleClickAway = event => {
      const menu = document.getElementById("format-menu");
      if (menu && !menu.contains(event.target)) {
        menu.style.display = "none";
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const messages = await listQuickMessages();
      const options = messages.map(m => {
        let truncatedMessage = m.message;
        if (isString(truncatedMessage) && truncatedMessage.length > 35) {
          truncatedMessage = m.message.substring(0, 35) + "...";
        }
        return {
          value: m.message,
          atalho: m.shortcode,
          label: `/${m.shortcode} - ${truncatedMessage}`
        };
      });
      setQuickMessages(options);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      isString(inputMessage) &&
      !isEmpty(inputMessage) &&
      inputMessage.length
    ) {
      const firstWord = inputMessage.charAt(0);
      setPopupOpen(firstWord.indexOf("/") > -1);

      const filteredOptions = quickMessages.filter(
        m => m.label.toLowerCase().indexOf(inputMessage.toLowerCase()) > -1
      );
      setOptions(filteredOptions);
    } else {
      setPopupOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage]);

  const onKeyPress = e => {
    if (loading) return;
    else if (!e.shiftKey && e.key === "Enter" && !isMobile()) {
      e.preventDefault();
      handleSendMessage();
      return;
    }
    handlePresenceUpdate && handlePresenceUpdate("composing");
  };

  const onPaste = e => {
    if (ticketStatus === "open") {
      handleInputPaste(e);
    }
  };

  const renderPlaceholder = () => {
    if (ticketStatus === "open") {
      return i18n.t("messagesInput.placeholderOpen");
    }
    return i18n.t("messagesInput.placeholderClosed");
  };

  const setInputRef = input => {
    if (input) {
      inputRef.current = input;
      inputRef.current.spellcheck = true;
    }
  };

  const showFormatMenu = () => {
    const selection = window.getSelection();
    const menuElement = document.getElementById("format-menu");
    if (!selection?.toString()) {
      menuElement.style.display = "none";
    } else {
      menuElement.style.display = "flex";
      menuElement.style.top = `${selection.anchorNode.offsetTop - 40}px`;
      menuElement.style.left = `${selection.anchorNode.offsetLeft}px`;
    }
  };

  const formatText = (prefix, suffix) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      let formattedText = `${prefix}${selectedText}${suffix}`;
      const textArea = inputRef.current;
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const textBefore = inputMessage.substring(0, start);
      const textAfter = inputMessage.substring(end);

      const prevChar = textBefore.charAt(start - 1);
      if (prevChar && prevChar !== " " && prevChar !== "\n") {
        formattedText = ` ${formattedText}`;
      }

      const nextChar = textAfter.charAt(0);
      if (nextChar && nextChar !== " " && nextChar !== "\n") {
        formattedText = `${formattedText} `;
      }

      setInputMessage(textBefore + formattedText + textAfter);
      document.getElementById("format-menu").style.display = "none";
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(
          start + prefix.length - 1,
          start + prefix.length + formattedText.length - 1
        );
        showFormatMenu();
      }, 0);
    }
  };

  const splitSelectionLines = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      const textArea = inputRef.current;
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;

      const firstLineStart =
        inputMessage.substring(0, start).lastIndexOf("\n") + 1;
      const lastLineEnd = end + inputMessage.substring(end).indexOf("\n");
      const textBefore = inputMessage.substring(0, firstLineStart);
      const textAfter = inputMessage.substring(lastLineEnd);

      const lines = inputMessage
        .substring(firstLineStart, lastLineEnd)
        .split("\n");
      return { lines, textBefore, textAfter };
    }
    return { lines: [], textBefore: inputMessage, textAfter: "" };
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection.toString().indexOf("\n") === -1) {
      formatText("`", "`");
      return;
    }

    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedText = "```\n" + lines.join("\n") + "\n```\n";
      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatListNumbered = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(
        (line, index) => `${index + 1}. ${line}`
      );
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatListBulleted = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(line => `* ${line}`);
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatQuote = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(line => `> ${line}`);
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  return (
    <div
      className={`${classes.messageInputWrapper} conversa-entrada-texto`}
      style={{ flexDirection: "column" }}
    >
      {quickMessages.length > 0 && (
        <div
          className="conversa-respostas-rapidas"
          role="group"
          aria-label={i18n.t("mainDrawer.listItems.quickMessages")}
        >
          {quickMessages.slice(0, 6).map(opcao => (
            <Tooltip key={opcao.atalho} title={opcao.value || ""}>
              <Button
                size="small"
                disabled={disableOption}
                onClick={() => {
                  setInputMessage(atual =>
                    atual ? `${atual}\n${opcao.value}` : opcao.value
                  );
                  inputRef.current?.focus();
                }}
              >
                /{opcao.atalho}
              </Button>
            </Tooltip>
          ))}
        </div>
      )}
      <Autocomplete
        disabled={disableOption}
        freeSolo
        open={popupOpen}
        PopperComponent={UpwardPopper}
        id="grouped-demo"
        value={inputMessage}
        options={options}
        closeIcon={null}
        getOptionLabel={option => {
          if (isObject(option)) {
            return option.label;
          } else {
            return option;
          }
        }}
        onChange={(event, opt) => {
          if (isObject(opt) && has(opt, "value")) {
            setInputMessage(opt.value);
            setTimeout(() => {
              inputRef.current.scrollTop = inputRef.current.scrollHeight;
            }, 200);
          }
        }}
        onInputChange={(event, opt, reason) => {
          if (reason === "input") {
            setInputMessage(event.target.value);
          }
        }}
        onKeyPress={onKeyPress}
        style={{ width: "100%" }}
        renderInput={params => {
          const { InputLabelProps, InputProps, ...rest } = params;
          return (
            <>
              <InputBase
                {...params.InputProps}
                {...rest}
                inputProps={{ ...params.inputProps, ...writingAssistance }}
                disabled={disableOption}
                inputRef={input => setInputRef(input)}
                placeholder={renderPlaceholder()}
                multiline
                className={classes.messageInput}
                minRows={compact ? 1 : 2}
                maxRows={compact ? 4 : 5}
                onPaste={onPaste}
                endAdornment={
                  isMobile() && (
                    <InputAdornment position="end">
                      <input
                        type="file"
                        id="camera-button"
                        accept="image/*"
                        capture="camera"
                        className={classes.uploadInput}
                        onChange={handleChangeMedias}
                      />
                      <label htmlFor="camera-button">
                        <IconButton
                          aria-label="camera-upload"
                          component="span"
                          disabled={disableOption}
                        >
                          <CameraAltIcon className={classes.cameraIcon} />
                        </IconButton>
                      </label>
                    </InputAdornment>
                  )
                }
                onKeyDownCapture={e => {
                  if (
                    !popupOpen &&
                    (e.key === "ArrowUp" || e.key === "ArrowDown")
                  ) {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={showFormatMenu}
                onKeyUp={showFormatMenu}
                onKeyDown={e => {
                  if (e.ctrlKey && e.key === "b") {
                    e.preventDefault();
                    formatText("*", "*");
                  } else if (e.ctrlKey && e.key === "i") {
                    e.preventDefault();
                    formatText("_", "_");
                  } else if (e.ctrlKey && e.key === "s") {
                    e.preventDefault();
                    formatText("~", "~");
                  } else if (e.ctrlKey && e.key === "m") {
                    e.preventDefault();
                    formatCode();
                  } else if (e.ctrlKey && e.key === "q") {
                    e.preventDefault();
                    formatQuote();
                  } else if (e.ctrlKey && e.key === "n") {
                    e.preventDefault();
                    formatListNumbered();
                  } else if (e.ctrlKey && e.key === "l") {
                    e.preventDefault();
                    formatListBulleted();
                  }
                }}
              />
              <div
                id="format-menu"
                className={classes.formatMenu}
                style={{ display: "none", position: "absolute", zIndex: 1000 }}
              >
                <IconButton
                  size="small"
                  onClick={() => formatText("*", "*")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography style={{ fontWeight: "bold", fontSize: "15px" }}>
                    B
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => formatText("_", "_")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography style={{ fontStyle: "italic", fontSize: "15px" }}>
                    I
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => formatText("~", "~")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography
                    style={{ textDecoration: "line-through", fontSize: "15px" }}
                  >
                    S
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatCode}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Code fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatListNumbered}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatListNumbered fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatListBulleted}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatListBulleted fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatQuote}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatQuote fontSize="small" />
                </IconButton>
              </div>
            </>
          );
        }}
      />
    </div>
  );
};

const MessageInputCustom = props => {
  const { ticket, showTabGroups, compact = false } = props;
  const { status: ticketStatus, id: ticketId } = ticket;
  const classes = useStyles();

  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [percentLoading, setPercentLoading] = useState(0);

  const inputRef = useRef();
  const uploadingMediaRef = useRef(false);
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { setEditingMessage, editingMessage } = useContext(EditMessageContext);
  const { user } = useContext(AuthContext);

  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);

  const socketManager = useContext(SocketContext);
  const [socket, setSocket] = useState(null);
  const [currentPresence, setCurrentPresence] = useState(null);
  const [presenceTimeout, setPresenceTimeout] = useState(null);

  useRascunhoDoTicket(ticketId, inputMessage, setInputMessage);

  // Conexao oficial da Meta: texto livre so vale nas 24h seguintes a ultima
  // mensagem do cliente. Fora disso o unico envio aceito e um template
  // aprovado, entao a barra precisa saber em que lado da janela esta.
  const isOfficial = isOfficialApiConnection(ticket?.whatsapp);
  const [serviceWindow, setServiceWindow] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const loadServiceWindow = useCallback(async () => {
    if (!isOfficial || !ticketId) return;

    setLoadingTemplates(true);
    try {
      const { data } = await api.get(`/tickets/${ticketId}/templates`);
      setServiceWindow(data.window);
      setTemplates(data.templates || []);
    } catch (err) {
      // A tela do atendimento nao pode quebrar porque a Graph API respondeu
      // mal; sem resposta, o envio segue liberado e o backend barra se
      // precisar.
      setServiceWindow(null);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [isOfficial, ticketId]);

  useEffect(() => {
    loadServiceWindow();
  }, [loadServiceWindow]);

  // Mensagem recebida reabre a janela na hora; sem isso o atendente ficava
  // bloqueado ate recarregar a pagina.
  useEffect(() => {
    if (!isOfficial || !ticketId) return undefined;

    const companyId = localStorage.getItem("companyId");
    const appMessageSocket = socketManager.GetSocket(companyId);

    const onAppMessage = data => {
      if (
        data.action === "create" &&
        !data.message?.fromMe &&
        Number(data.message?.ticketId) === Number(ticketId)
      ) {
        loadServiceWindow();
      }
    };

    appMessageSocket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      appMessageSocket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [isOfficial, ticketId, socketManager, loadServiceWindow]);

  useEffect(() => {
    const socket = socketManager.GetSocket();
    if (socket) {
      setSocket(socket);
    }
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    if (editingMessage) {
      if (signMessage && editingMessage.body.startsWith(`*${user.name}:*\n`)) {
        setInputMessage(
          editingMessage.body.substr(editingMessage.body.indexOf("\n") + 1)
        );
      } else {
        setInputMessage(editingMessage.body);
      }
    }

    if (replyingMessage || editingMessage) {
      inputRef.current.focus();
    }
  }, [replyingMessage, editingMessage, signMessage, user.name]);

  useEffect(() => {
    inputRef.current.focus();
    return () => {
      setShowEmoji(false);
      setMedias([]);
      setReplyingMessage(null);
      setEditingMessage(null);
      setInputMessage("");
    };
  }, [ticketId]);

  // const handleChangeInput = e => {
  // 	if (isObject(e) && has(e, 'value')) {
  // 		setInputMessage(e.value);
  // 	} else {
  // 		setInputMessage(e.target.value)
  // 	}
  // };

  const handleAddEmoji = e => {
    let emoji = e.native;
    setInputMessage(prevState => prevState + emoji);
  };

  const handleChangeMedias = e => {
    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
    // O input permanece montado enquanto a legenda e editada. Limpar o valor
    // permite remover e selecionar novamente o mesmo arquivo.
    e.target.value = "";
  };

  const handleInputPaste = e => {
    const clipboard = e.clipboardData;
    if (!clipboard) return;

    const itemFiles = Array.from(clipboard.items || [])
      .filter(item => item.kind === "file")
      .map(item => item.getAsFile?.())
      .filter(Boolean);
    const pastedFiles = itemFiles.length
      ? itemFiles
      : Array.from(clipboard.files || []);
    if (!pastedFiles.length) return;

    e.preventDefault();
    const normalizedFiles = pastedFiles.map((file, index) => {
      if (file.name && !/^image\.png$/i.test(file.name)) return file;
      const extension =
        file.type?.split("/")[1]?.replace("jpeg", "jpg") || "bin";
      return new File(
        [file],
        `clipboard-${Date.now()}-${index + 1}.${extension}`,
        {
          type: file.type,
          lastModified: file.lastModified || Date.now()
        }
      );
    });
    setMedias(current => [...current, ...normalizedFiles]);
  };

  const handleUploadMedia = async e => {
    e?.preventDefault();
    if (!medias.length || uploadingMediaRef.current || loading) return;

    uploadingMediaRef.current = true;
    setLoading(true);
    handlePresenceUpdate(null);

    try {
      const preparedMedias = await prepareMediaUpload(medias);
      const formData = new FormData();
      formData.append("fromMe", true);

      const text = inputMessage.trim();
      const caption = text
        ? signMessage
          ? `*${user?.name}:*\n${text}`
          : text
        : "";
      formData.append("body", caption);
      if (replyingMessage?.id) {
        formData.append("quotedMsgId", replyingMessage.id);
      }

      preparedMedias.forEach(({ file, filename }) => {
        formData.append("medias", file, filename);
      });

      await api.post(`/messages/${ticketId}`, formData, {
        onUploadProgress: event => {
          if (!event.total) return;
          const progress = Math.round((event.loaded * 100) / event.total);
          setPercentLoading(Math.max(1, progress));
        }
      });

      setMedias([]);
      setInputMessage("");
      setShowEmoji(false);
      setReplyingMessage(null);
      setEditingMessage(null);
    } catch (err) {
      toastError(err);
    } finally {
      uploadingMediaRef.current = false;
      setLoading(false);
      setPercentLoading(0);
    }
  };

  const handlePresenceUpdate = presence => {
    if (!socket || currentPresence === presence) return;

    if (presenceTimeout) {
      clearTimeout(presenceTimeout);
      setPresenceTimeout(null);
    }

    if (!presence) {
      setCurrentPresence(null);
      socket.emit("presenceUpdate", {
        ticketId,
        presence: "paused"
      });
      return;
    }

    setCurrentPresence(presence);
    socket.emit("presenceUpdate", {
      ticketId,
      presence
    });

    if (presence === "composing") {
      setPresenceTimeout(
        setTimeout(() => {
          setCurrentPresence(null);
          socket.emit("presenceUpdate", {
            ticketId,
            presence: "paused"
          });
        }, 5000)
      );
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    //if (disableOption) return
    setLoading(true);

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim(),
      quotedMsgId: replyingMessage?.id || null
    };

    handlePresenceUpdate(null);

    const url =
      editingMessage !== null
        ? `/messages/edit/${editingMessage.id}`
        : `/messages/${ticketId}`;
    api.post(url, message).catch(err => {
      toastError(err);
    });

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    setEditingMessage(null);
    inputRef.current.focus();
  };

  const handleStartRecording = async () => {
    if (disableOption) return;
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
      handlePresenceUpdate("recording");
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    handlePresenceUpdate(null);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-record-site-${new Date().getTime()}.mp3`;
      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    handlePresenceUpdate(null);
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const isGroup = showTabGroups && ticket.isGroup;
  // Janela fechada: a Meta recusa texto livre e midia (131047). Bloquear aqui
  // evita a mensagem que "sumia" sem o atendente entender o motivo.
  const windowClosed =
    isOfficial && !isGroup && !!serviceWindow && !serviceWindow.open;
  const disableOption =
    (!isGroup && loading) ||
    recording ||
    ticketStatus === "closed" ||
    windowClosed;
  // Gravar bloqueia o resto da barra, mas nao pode bloquear os botoes da
  // propria gravacao: cancelar e enviar sao a unica saida do modo gravacao.
  const disableActionButtons =
    (!isGroup && loading) || ticketStatus === "closed" || windowClosed;

  const renderReplyingMessage = message => {
    const attachmentName = message.mediaUrl?.split("/").pop();
    const preview = message.body?.startsWith('{"ticketzvCard"')
      ? "🪪"
      : message.body ||
        (attachmentName
          ? `📎 ${attachmentName}`
          : `📎 ${message.mediaType || i18n.t("conversa.arquivos")}`);
    const author = message.fromMe
      ? user?.name
      : message.contact?.name || ticket.contact?.name;
    return (
      <div className={`${classes.replyginMsgWrapper} conversa-resposta-previa`}>
        <div
          className={`${classes.replyginMsgContainer} conversa-resposta-conteudo`}
        >
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe
            })}
          ></span>
          {replyingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.replying")} {author}
              </span>
              <WhatsMarked>{preview}</WhatsMarked>
            </div>
          )}
          {editingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.editing")}
              </span>
              <WhatsMarked>{message.body}</WhatsMarked>
            </div>
          )}
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={disableOption}
          onClick={() => {
            setReplyingMessage(null);
            setEditingMessage(null);
          }}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  return (
    <Paper
      square
      elevation={0}
      className={`${classes.mainWrapper} conversa-entrada`}
      data-conversation-escape-block={recording || loading || medias.length > 0}
    >
      {(replyingMessage && renderReplyingMessage(replyingMessage)) ||
        (editingMessage && renderReplyingMessage(editingMessage))}
      {windowClosed && ticketStatus !== "closed" && (
        <div className={classes.serviceWindowBar}>
          <Typography variant="body2" className={classes.serviceWindowText}>
            {i18n.t("messagesInput.serviceWindowClosed")}
          </Typography>
          <Button
            size="small"
            color="primary"
            variant="contained"
            onClick={() => setTemplateModalOpen(true)}
          >
            {i18n.t("messagesInput.sendTemplate")}
          </Button>
        </div>
      )}
      <TemplateMessageModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        ticketId={ticketId}
        templates={templates}
        loading={loadingTemplates}
        onSent={loadServiceWindow}
      />
      {medias.length > 0 && (
        <div
          className={`${classes.viewMediaInputWrapper} conversa-anexos-previa`}
        >
          <IconButton
            aria-label="cancel-upload"
            component="span"
            disabled={disableOption}
            onClick={() => setMedias([])}
          >
            <CancelIcon className={classes.sendMessageIcons} />
          </IconButton>

          {loading ? (
            <div className={classes.selectedMediaProgress}>
              <LinearWithValueLabel progress={percentLoading} />
            </div>
          ) : (
            <Typography
              variant="body2"
              className={classes.selectedMediaNames}
              title={medias.map(media => media.name).join(", ")}
            >
              {medias.map(media => media.name).join(", ")}
            </Typography>
          )}
        </div>
      )}
      <div
        className={clsx(classes.newMessageBox, "conversa-caixa-mensagem", {
          "conversa-caixa-mensagem--compact": compact
        })}
      >
        {isMobile() || (
          <EmojiOptions
            disabled={disableOption}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
          />
        )}

        <FileInput
          disableOption={disableOption}
          handleChangeMedias={handleChangeMedias}
        />

        <IconSwitch
          setter={setSignMessage}
          value={signMessage}
          icon={faSignature}
          tooltip={i18n.t("messagesInput.signMessage")}
        />

        <CustomInput
          compact={compact}
          loading={loading}
          inputRef={inputRef}
          ticketStatus={(isGroup && "open") || ticketStatus}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          // handleChangeInput={handleChangeInput}
          handleSendMessage={
            medias.length ? handleUploadMedia : handleSendMessage
          }
          handleInputPaste={handleInputPaste}
          handleChangeMedias={handleChangeMedias}
          handlePresenceUpdate={handlePresenceUpdate}
          disableOption={disableOption}
        />

        <ActionButtons
          inputMessage={inputMessage}
          hasMedia={medias.length > 0}
          loading={loading}
          recording={recording}
          ticketStatus={ticketStatus}
          disableOption={disableActionButtons}
          handleSendMessage={
            medias.length ? handleUploadMedia : handleSendMessage
          }
          handleCancelAudio={handleCancelAudio}
          handleUploadAudio={handleUploadAudio}
          handleStartRecording={handleStartRecording}
        />
      </div>
    </Paper>
  );
};

export default withWidth()(MessageInputCustom);
