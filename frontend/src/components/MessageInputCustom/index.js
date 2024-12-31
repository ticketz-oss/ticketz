import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import clsx from "clsx";

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
import { FormControlLabel, Switch, Tooltip } from "@material-ui/core";
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
import MarkdownWrapper from "../MarkdownWrapper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature, faNoteSticky } from '@fortawesome/free-solid-svg-icons';
import { RecordOggOpus } from "../../helpers/recordOggOpus";
import { makeRandomId } from "../../helpers/makeRandomId";

import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachmentIcon from '@material-ui/icons/Attachment';
import Popover from '@material-ui/core/Popover';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import Attachment from "../Attachment";

const oggRecorder = new RecordOggOpus();

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
  
  attachmentLoading: {
  },

  audioLoading: {
    color: green[500],
    opacity: "70%",
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
  },

  cancelAudioIcon: {
    color: "red",
  },

  sendAudioIcon: {
    color: "green",
  },

  disabledIcon: {
    color: "gray",
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

  hideInput: {
    display: "none"
  },
  
  attachmentInfo: {
    minHeight: 48,
    textAlign: "right",
    display: "flex",
  },  
  
  attachmentLine: {
    width: "100%",
    overflowX: "auto",
  },

  verticalMiddle: {
    marginTop: "auto",
    marginBottom: "auto",
  }

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
    pastOneSecond,
    medias,
  } = props;
  const classes = useStyles();
  if (inputMessage || medias.length>0) {
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
          disabled={disableOption || !pastOneSecond}
        >
          <CheckCircleOutlineIcon className={ pastOneSecond ? classes.sendAudioIcon : classes.disabledIcon } />
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
    recording,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    disableOption,
    setQuickMessageAttachment,
    setMedias,
  } = props;
  const classes = useStyles();
  const [quickMessages, setQuickMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const { user } = useContext(AuthContext);

  const { list: listQuickMessages } = useQuickMessages();

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
          id: m.id,
          mediaName: m.mediaName,
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
    if (loading || e.shiftKey) return;
    else if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
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
    }
  };

  return (
    <div className={recording ? classes.hideInput : classes.messageInputWrapper}>
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
            console.log(opt);
            setQuickMessageAttachment(
              opt.mediaName ? { id: opt.id, mediaName: opt.mediaName } : null
            );
            setMedias([]);
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
            <InputBase
              {...params.InputProps}
              {...rest}
              disabled={disableOption}
              inputRef={setInputRef}
              placeholder={renderPlaceholder()}
              multiline
              className={classes.messageInput}
              maxRows={5}
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
            />
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
  const [annotateMessage, setAnnotateMessage] = useState(false);
  const [quickMessageAttachment, setQuickMessageAttachment] = useState(null);

  const isNarrowScreen = useMediaQuery(theme => theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const [pastOneSecond, setPastOneSecond] = useState(false);
  
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;


  useEffect(() => {
    if (editingMessage) {
      if (signMessage && editingMessage.body.startsWith(`*${user.name}:*\n`)) {
        setInputMessage(editingMessage.body.substr(editingMessage.body.indexOf("\n") + 1));
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
      setQuickMessageAttachment(null);
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
    setQuickMessageAttachment(null);
    setMedias(selectedMedias);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      setQuickMessageAttachment(null);
      setMedias([e.clipboardData.files[0]]);
    }
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);

    inputMessage && formData.append(
      "body",
      signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim()
    );

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
          },
          error(err) {
            alert('erro')
            console.log(err.message);
          },

        });
      } else {
        formData.append("medias", media);
      }


    },);

    setTimeout(async () => {

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
            setInputMessage("");
            setShowEmoji(false);
            setReplyingMessage(null);
            setEditingMessage(null);
            setMedias([]);
            setQuickMessageAttachment(null);
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


    }, 2000)

  }

  const handleSendMessage = async (e) => {
    if (medias.length > 0) {
      return handleUploadMedia(e);
    }
    
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
      internal: annotateMessage,
      quickMessageMediaId: quickMessageAttachment?.id,
    };
    setAnnotateMessage(false);

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
    setMedias([]);
    setQuickMessageAttachment(null);
  };

  const handleStartRecording = async () => {
    if (disableOption) return;
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await oggRecorder.start();
      setRecording(true);
      setPastOneSecond(false);
      setTimeout(() => {
        setPastOneSecond(true);
        }, 1000);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setRecording(false);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      oggRecorder.export(async (blob) => {
        if (blob.size < 1000) {
          setLoading(false);
          setRecording(false);
          return;
        }

        try {
          const formData = new FormData();
          const filename = `ticketz-audio-${makeRandomId(10)}.ogg`;
          formData.append("medias", blob, filename);
          formData.append("body", filename);
          formData.append("fromMe", true);
          formData.append("ptt", true);

          await api.post(`/messages/${ticketId}`, formData);
        } catch (err) {
          toastError(err);
        }
        setLoading(false);
        setRecording(false);
      });
    } catch (err) {
      toastError(err);
    }
  };

  const handleCancelAudio = async () => {
    try {
      await oggRecorder.stop();
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
              <MarkdownWrapper>
                {message.body.startsWith('{"ticketzvCard":') ? "🪪" : message.body}
              </MarkdownWrapper>
            </div>
          )}
          {editingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.editing")}
              </span>
              <MarkdownWrapper>
                {message.body}
              </MarkdownWrapper>
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

  if (medias.length < 0)
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
        { ( medias.length > 0 || quickMessageAttachment ) &&
          <div className={classes.attachmentLine}>
          <div className={classes.attachmentInfo}>
            {
              medias.map((media) => {
                return <Attachment media={media} onDelete={() => false}></Attachment>
              })
            }
            {
              quickMessageAttachment &&
                <div className={classes.verticalMiddle}><AttachmentIcon />{quickMessageAttachment?.mediaName || "attached file"}</div>
            }
            {loading ? (
              <CircularProgress className={classes.attachmentLoading} variant={percentLoading < 5 ? "indeterminate" : "determinate"} value={percentLoading} />
            ) : (
              <IconButton
                aria-label="deleteAttachment"
                component="span"
                onClick={() => { setMedias([]); setQuickMessageAttachment(null); }}
              >
                <DeleteIcon className={classes.sendMessageIcons} />
              </IconButton>
            )}
          </div>
          </div>
        }
        <div className={classes.newMessageBox}>
          <EmojiOptions
            disabled={disableOption}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
          />

          {isNarrowScreen ? (
            <div>
              <IconButton aria-describedby={id} variant="contained" color="primary" onClick={handleMenuClick}>
                <AddIcon className={classes.sendMessageIcons} />
              </IconButton>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                <FileInput
                  disableOption={disableOption}
                  handleChangeMedias={handleChangeMedias}
                />

                <IconSwitch
                  setter={setAnnotateMessage}
                  value={annotateMessage}
                  icon={faNoteSticky}
                  tooltip={i18n.t("messagesInput.annotateMessage")}
                />

                <IconSwitch
                  setter={setSignMessage}
                  value={signMessage}
                  icon={faSignature}
                  tooltip={i18n.t("messagesInput.signMessage")}
                />
              </Popover>
            </div>
          ) : (
            <>
              <FileInput
                disableOption={disableOption}
                handleChangeMedias={handleChangeMedias}
              />

              <IconSwitch
                setter={setAnnotateMessage}
                value={annotateMessage}
                icon={faNoteSticky}
                tooltip={i18n.t("messagesInput.annotateMessage")}
              />

              <IconSwitch
                setter={setSignMessage}
                value={signMessage}
                icon={faSignature}
                tooltip={i18n.t("messagesInput.signMessage")}
              />
            </>
          )}
          <CustomInput
            loading={loading}
            recording={recording}
            inputRef={inputRef}
            ticketStatus={(isGroup && "open" ) || ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            // handleChangeInput={handleChangeInput}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            disableOption={disableOption}
            setQuickMessageAttachment={setQuickMessageAttachment}
            setMedias={setMedias}
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
            pastOneSecond={pastOneSecond}
            medias={medias}
          />
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);
