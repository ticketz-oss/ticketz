import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";

import { 
  Code,
  FormatListNumbered,
  FormatListBulleted,
  FormatQuote,
} from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CameraAltIcon from "@material-ui/icons/CameraAlt";
import { FormControlLabel, Switch, Tooltip, InputAdornment, Typography } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { isString, isEmpty, isObject, has } from "lodash";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";

import useQuickMessages from "../../hooks/useQuickMessages";

import Compressor from 'compressorjs';
import LinearWithValueLabel from "./ProgressBarCustom";
import WhatsMarked from "react-whatsmarked";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature } from '@fortawesome/free-solid-svg-icons';
import { isMobile } from "../../helpers/isMobile";
import { SocketContext } from "../../context/Socket/SocketContext";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  newMessageBox: {
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },

  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    //background: "#fff",
    border: "1px solid #ccc",
    display: "flex",
    borderRadius: 20,
    flex: 1,
  },

  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },

  cameraIcon: {
    color: "grey",
  },

  sendMessageIcons: {
    color: "grey",
  },

  uploadInput: {
    display: "none",
  },

  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },

  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },

  audioLoading: {
    color: green[500],
    opacity: "70%",
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
  },

  cancelAudioIcon: {
    color: "red",
  },

  sendAudioIcon: {
    color: "green",
  },

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
  },

  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  iconSwitch: {
    color: (props) => (props.value ? theme.palette.primary.main : "gray"),
    width: 48,
    height: 48
  },

  formatMenu: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 30,
    boxShadow: theme.shadows[2],
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
  },
}));

const EmojiOptions = (props) => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowEmoji((prevState) => !prevState)}
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

const SignSwitch = (props) => {
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

const IconSwitch = (props) => {
  const { setter, value, icon, tooltip } = props;
  const classes = useStyles({ value });

  return (
    <Tooltip title={tooltip}>
      <IconButton
        onClick={() => setter(!value)}
        className={classes.iconSwitch}
      >
        <FontAwesomeIcon icon={icon} />
      </IconButton>
    </Tooltip>
  );
};

const FileInput = (props) => {
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

const ActionButtons = (props) => {
  const {
    inputMessage,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
    disableOption,
  } = props;
  const classes = useStyles();
  if (inputMessage) {
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

const CustomInput = (props) => {
  const {
    loading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    handleChangeMedias,
    handlePresenceUpdate,
    disableOption,
  } = props;
  const classes = useStyles();
  const [quickMessages, setQuickMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const { user } = useContext(AuthContext);

  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    const handleClickAway = (event) => {
      const menu = document.getElementById('format-menu');
      if (menu && !menu.contains(event.target)) {
        menu.style.display = 'none';
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const messages = await listQuickMessages();
      const options = messages.map((m) => {
        let truncatedMessage = m.message;
        if (isString(truncatedMessage) && truncatedMessage.length > 35) {
          truncatedMessage = m.message.substring(0, 35) + "...";
        }
        return {
          value: m.message,
          label: `/${m.shortcode} - ${truncatedMessage}`,
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
        (m) => m.label.indexOf(inputMessage) > -1
      );
      setOptions(filteredOptions);
    } else {
      setPopupOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage]);

  const onKeyPress = (e) => {
    if (loading) return;
    else if ( !e.shiftKey && e.key === "Enter" && !isMobile()) {
      e.preventDefault();
      handleSendMessage();
      return;
    }
    handlePresenceUpdate && handlePresenceUpdate("composing");
  };

  const onPaste = (e) => {
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

  const setInputRef = (input) => {
    if (input) {
      inputRef.current = input;
      inputRef.current.spellcheck = true;
    }
  };

  const showFormatMenu = () => {
    const selection = window.getSelection();
    const menuElement = document.getElementById('format-menu');
    if (!selection?.toString()) {
      menuElement.style.display = 'none';
    } else {
      menuElement.style.display = 'flex';
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
      if (prevChar && prevChar !== ' ' && prevChar !== '\n') {
        formattedText = ` ${formattedText}`;
      }
      
      const nextChar = textAfter.charAt(0);
      if (nextChar && nextChar !== ' ' && nextChar !== '\n') {
        formattedText = `${formattedText} `;
      }
      
      setInputMessage(textBefore + formattedText + textAfter);
      document.getElementById('format-menu').style.display = 'none';
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

      const firstLineStart = inputMessage.substring(0, start).lastIndexOf("\n")+1;
      const lastLineEnd = end+inputMessage.substring(end).indexOf("\n");
      const textBefore = inputMessage.substring(0, firstLineStart);
      const textAfter = inputMessage.substring(lastLineEnd);

      const lines = inputMessage.substring(firstLineStart, lastLineEnd).split('\n');
      return { lines, textBefore, textAfter };
    }
    return { lines: [], textBefore: inputMessage, textAfter: "" };
  };
  
  const formatCode = () => {
    const selection = window.getSelection();
    if (selection.toString().indexOf('\n') === -1) {
      formatText('`', '`');
      return;
    }
      
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedText = "```\n" + lines.join('\n') + "\n```\n";
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
      const formattedLines = lines.map((line, index) => `${index + 1}. ${line}`);
      const formattedText = formattedLines.join('\n');

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
      const formattedText = formattedLines.join('\n');

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
      const formattedText = formattedLines.join('\n');

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
    <div className={classes.messageInputWrapper}>
      <Autocomplete
        disabled={disableOption}
        freeSolo
        open={popupOpen}
        id="grouped-demo"
        value={inputMessage}
        options={options}
        closeIcon={null}
        getOptionLabel={(option) => {
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
        onPaste={onPaste}
        onKeyPress={onKeyPress}
        style={{ width: "100%" }}
        renderInput={(params) => {
          const { InputLabelProps, InputProps, ...rest } = params;
          return (
            <>
            <InputBase
              {...params.InputProps}
              {...rest}
              disabled={disableOption}
              inputRef={(input) => setInputRef(input)}
              placeholder={renderPlaceholder()}
              multiline
              className={classes.messageInput}
              maxRows={5}
              endAdornment={
                isMobile() &&
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
              }    
              onKeyDownCapture={(e) => {
                if (
                  !popupOpen && (
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowDown'
                  )
                ) {
                  e.stopPropagation();
                }
              }}
              onMouseUp={showFormatMenu}
              onKeyUp={showFormatMenu}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'b') {
                  e.preventDefault();
                  formatText('*', '*');
                } else if (e.ctrlKey && e.key === 'i') {
                  e.preventDefault();
                  formatText('_', '_');
                } else if (e.ctrlKey && e.key === 's') {
                  e.preventDefault();
                  formatText('~', '~');
                } else if (e.ctrlKey && e.key === 'm') {
                  e.preventDefault();
                  formatCode();
                } else if (e.ctrlKey && e.key === 'q') {
                  e.preventDefault();
                  formatQuote();
                } else if (e.ctrlKey && e.key === 'n') {
                  e.preventDefault();
                  formatListNumbered();
                } else if (e.ctrlKey && e.key === 'l') {
                  e.preventDefault();
                  formatListBulleted();
                }
              }}
            />
            <div
              id="format-menu"
              className={classes.formatMenu}
              style={{ display: 'none', position: 'absolute', zIndex: 1000 }}
            >
              <IconButton 
                size="small" 
                onClick={() => formatText('*','*')}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <Typography style={{ fontWeight: 'bold', fontSize: '15px' }}>B</Typography>
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => formatText('_','_')}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <Typography style={{ fontStyle: 'italic', fontSize: '15px' }}>I</Typography>
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => formatText('~','~')}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <Typography style={{ textDecoration: 'line-through', fontSize: '15px' }}>S</Typography>
              </IconButton>
              <IconButton 
                size="small" 
                onClick={formatCode}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <Code fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={formatListNumbered}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <FormatListNumbered fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={formatListBulleted}
                style={{ padding: '6px', margin: '0 2px' }}
              >
                <FormatListBulleted fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={formatQuote}
                style={{ padding: '6px', margin: '0 2px' }}
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

const MessageInputCustom = (props) => {
  const { ticket, showTabGroups } = props;
  const { status: ticketStatus, id: ticketId } = ticket;
  const classes = useStyles();

  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [percentLoading, setPercentLoading] = useState(0);

  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { setEditingMessage, editingMessage } = useContext(
		EditMessageContext
	);  
  const { user } = useContext(AuthContext);

  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);

  const socketManager = useContext(SocketContext);
  const [socket, setSocket] = useState(null);
  const [currentPresence, setCurrentPresence] = useState(null);
  const [presenceTimeout, setPresenceTimeout] = useState(null);

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
        setInputMessage(editingMessage.body.substr(editingMessage.body.indexOf("\n")+1));
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

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      setMedias([e.clipboardData.files[0]]);
    }
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);

    medias.forEach(async (media, idx) => {

      const file = media;

      if (!file) { return; }

      if (media?.type.split('/')[0] == 'image') {
        new Compressor(file, {
          quality: 0.7,

          async success(media) {
            //const formData = new FormData();
            // The third parameter is required for server
            //formData.append('file', result, result.name);

            formData.append("medias", media);
            formData.append("body", media.name);

          },
          error(err) {
            alert('erro')
            console.log(err.message);
          },

        });
      } else {
        formData.append("medias", media);
        formData.append("body", media.name);

      }


    },);

    setTimeout(async()=> {

      try {
        await api.post(`/messages/${ticketId}`, formData, {
          onUploadProgress: (event) => {
            let progress = Math.round(
              (event.loaded * 100) / event.total
            );
            setPercentLoading(progress);
            console.log(
              `A imagem  está ${progress}% carregada... `
            );
          },
        })
          .then((response) => {
            setLoading(false)
            setMedias([])
            setPercentLoading(0);
            console.log(
              `A imagem á foi enviada para o servidor!`

            );
          })
          .catch((err) => {
            console.error(
              `Houve um problema ao realizar o upload da imagem.`
            );
            console.log(err);
          });
      } catch (err) {
        toastError(err);
      }


    },2000)

  }

  const handlePresenceUpdate = (presence) => {
    if (!socket || currentPresence === presence) return;
    
    if (presenceTimeout) {
      clearTimeout(presenceTimeout);
      setPresenceTimeout(null);
    }
    
    if (!presence) {
      setCurrentPresence(null);
      socket.emit("presenceUpdate", {
        ticketId,
        presence: "paused",
      });
      return;
    }
    
    setCurrentPresence(presence);
    socket.emit("presenceUpdate", {
      ticketId,
      presence,
    });

    if (presence === "composing") {
      setPresenceTimeout(
        setTimeout(() => {
          setCurrentPresence(null);
          socket.emit("presenceUpdate", {
            ticketId,
            presence: "paused",
          });
        }, 5000)
      );
    }
  }  

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
      quotedMsg: replyingMessage,
    };

    handlePresenceUpdate(null);
    
    const url = editingMessage !== null ?
      `/messages/edit/${editingMessage.id}` :
      `/messages/${ticketId}`;
    api.post(url, message).catch((err) => {
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
    if(disableOption)return;
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
  const disableOption = !isGroup && loading || recording || ticketStatus === "closed";

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          {replyingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.replying")} {message.contact?.name}
              </span>
              <WhatsMarked>
                { message.body.startsWith('{"ticketzvCard":') ? "🪪" : message.body }
              </WhatsMarked>
            </div>
          )}
          {editingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.editing")}
              </span>
              <WhatsMarked>
                {message.body}
              </WhatsMarked>
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
              setInputMessage("");
          }}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  if (medias.length > 0)
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-upload"
          component="span"
          disabled={disableOption}
          onClick={(e) => setMedias([])}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            {/*<CircularProgress className={classes.circleLoading} />*/}
            <LinearWithValueLabel progress={percentLoading} />
          </div>
        ) : (
          <span>
            {medias[0]?.name}
            {/* <img src={media.preview} alt=""></img> */}
          </span>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={handleUploadMedia}
          disabled={disableOption}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  else {
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {(replyingMessage && renderReplyingMessage(replyingMessage)) || (editingMessage && renderReplyingMessage(editingMessage))}
        <div className={classes.newMessageBox}>
          {
            isMobile() ||
            <EmojiOptions
              disabled={disableOption}
              handleAddEmoji={handleAddEmoji}
              showEmoji={showEmoji}
              setShowEmoji={setShowEmoji}
            />
          }

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
            loading={loading}
            inputRef={inputRef}
            ticketStatus={(isGroup && "open" ) || ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            // handleChangeInput={handleChangeInput}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            handleChangeMedias={handleChangeMedias}
            handlePresenceUpdate={handlePresenceUpdate}
            disableOption={disableOption}
          />

          <ActionButtons
            inputMessage={inputMessage}
            loading={loading}
            recording={recording}
            ticketStatus={ticketStatus}
            disabeleOption={disableOption}
            handleSendMessage={handleSendMessage}
            handleCancelAudio={handleCancelAudio}
            handleUploadAudio={handleUploadAudio}
            handleStartRecording={handleStartRecording}
          />
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);
