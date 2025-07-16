import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Avatar,
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputBase,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";

import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import CancelIcon from "@material-ui/icons/Cancel";
import CircularProgress from "@material-ui/core/CircularProgress";
import ModalImageCors from "../../components/ModalImageCors";
import { GetApp } from "@material-ui/icons";
import toastError from "../../errors/toastError";
import MicIcon from "@material-ui/icons/Mic";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import RecordingTimer from "../../components/MessageInputCustom/RecordingTimer";
import { canPlayOggOpus, canRecordOggOpus } from "../../helpers/detectOggOpusSupport";
import { Html5AudioPlayer } from "../../components/Html5AudioPlayer";
import { OggAudioPlayer } from "../../components/OggAudioPlayer";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { RecordOggOpus } from "../../helpers/recordOggOpus";
import { makeRandomId } from "../../helpers/makeRandomId";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    height: "100%",
    borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  },
  messageList: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    height: "100%",
    ...theme.scrollbarStyles,
    backgroundColor: theme.palette.chatlist.main,
    padding: 20,
  },
  inputArea: {
    position: "relative",
    height: "auto",
  },
  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },
  buttonSend: {
    margin: theme.spacing(1),
  },
  boxLeft: {
    padding: "5px 5px 0px 5px",
    marginBottom: 0,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 2,
    position: "relative",
    alignSelf: "flex-start",
    backgroundColor: theme.palette.chatBubbleReceived.main,
    color: theme.palette.chatBubbleReceived.contrastText,
    minWidth: 100,
    maxWidth: 600,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000",
  },
  boxRight: {
    padding: "5px 5px 0px 5px",
    marginBottom: 0,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 2,
    position: "relative",
    alignSelf: "flex-end",
    backgroundColor: theme.palette.chatBubbleFromMe.main,
    color: theme.palette.chatBubbleFromMe.contrastText,
    minWidth: 100,
    maxWidth: 600,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000",
  },
  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  sendMessageIcons: {
    color: "grey",
  },
  uploadInput: {
    display: "none",
  },
  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },
  viewMediaInputWrapper: {
    display: "flex",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
    justifyContent: 'flex-end',
  },

  cancelAudioIcon: {
    color: "red",
  },

  audioLoading: {
    color: green[500],
    opacity: "70%",
  },

  sendAudioIcon: {
    color: "green",
  },
  
  disabledIcon: {
    color: "grey",
  },
  
  timestamp: {
    color: theme.mode === 'light' ? "#999" : "#d0d0d0",
    right: 5,
    bottom: 0,
    position: "absolute",
    fontSize: 11
  },
  messageText: {
    padding: "3px 80px 6px 6px",
    overflowWrap: "break-word",
    marginBottom: 5,
  },
  
  spacer: {
    marginTop: 16,
  },
  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    border: "1px solid #ccc",
    display: "flex",
    borderRadius: 20,
    flex: 1,
  },  
  
}));

const oggRecorder = new RecordOggOpus();

const recordOpus = canRecordOggOpus();
const playOpus = recordOpus || canPlayOggOpus();

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo,
}) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { relativePastTime } = useDate();
  const baseRef = useRef();

  const [contentMessage, setContentMessage] = useState("");
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pastOneSecond, setPastOneSecond] = useState(false);

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({});
    }
  };

  const unreadMessages = (chat) => {
    if (chat !== undefined) {
      const currentUser = chat.users.find((u) => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) { }
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  const handleChangeMedias = (e) => {


    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
  };

  const checkMessageMedia = (message) => {

    if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaPath} />;
    }
    if (message.mediaType === "audio") {
      return (
        !playOpus && message.mediaPath.endsWith(".ogg") ?
          <OggAudioPlayer src={message.mediaPath}>
            <Avatar style={{ backgroundColor: generateColor(message.sender.name), color: "white", fontWeight: "bold" }}>{getInitials(message.sender.name || "")}</Avatar>
          </OggAudioPlayer> :
          <Html5AudioPlayer src={message.mediaPath}>
            <Avatar style={{ backgroundColor: generateColor(message.sender.name), color: "white", fontWeight: "bold" }}>{getInitials(message.sender.name || "")}</Avatar>
          </Html5AudioPlayer>
      );
    }

    if (message.mediaType === "video") {
      return (
        <video
          className={classes.messageMedia}
          src={message.mediaPath}
          controls
        />
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={message.mediaPath}
            >
              Download
            </Button>
          </div>
          {/* <Divider /> */}
        </>
      );
    }
  };

  const handleSendMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);
    medias.forEach((media) => {
      formData.append("medias", media);
      formData.append("message", media.name);
    });

    try {
      await api.post(`/chats/${chat.id}/messages`, formData);
    } catch (err) {
      console.log(err);
      toastError(err);
    }

    setLoading(false);
    setMedias([]);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await oggRecorder.start();
      setRecording(true);
      setLoading(false);
      setPastOneSecond(false);
      setTimeout(() => {
        setPastOneSecond(true);
      }, 1000);
    } catch (err) {
      toastError(err);
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
          formData.append("message", "audio");
          formData.append("fromMe", true);

          await api.post(`/chats/${chat.id}/messages`, formData);
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

  let previousSenderId = null;

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {Array.isArray(messages) &&
          messages.map((item, key) => {
            let spacer = null;
            if (previousSenderId !== null && previousSenderId !== item.senderId) {
              spacer = <div className={classes.spacer}></div>;
            }
            previousSenderId = item.senderId;
            
            if (item.senderId === user.id) {
              return (
                <>
                  {spacer}
                  <Box key={key} className={classes.boxRight}>
                    {item.mediaPath && checkMessageMedia(item)}
                    {!item.mediaPath && <div className={classes.messageText}>{item.message}</div>}
                    <Typography className={classes.timestamp} variant="caption" display="block">
                      {relativePastTime(item.createdAt)}
                    </Typography>
                  </Box>
                </>
              );
            } else {
              return (
                <>
                  {spacer}
                  <Box key={key} className={classes.boxLeft}>
                    <Typography className={classes.messageContactName} variant="subtitle2">
                      {item.sender.name}
                    </Typography>
                    {item.mediaPath && checkMessageMedia(item)}
                    {!item.mediaPath && <div className={classes.messageText}>{item.message}</div>}
                    <Typography className={classes.timestamp} variant="caption" display="block">
                      {relativePastTime(item.createdAt)}
                    </Typography>
                  </Box>
                </>
              );
            }
          })}
        <div ref={baseRef}></div>
      </div>
      <div className={classes.inputArea}>
        <FormControl variant="outlined" fullWidth>

          {recording ? (
            <div className={classes.recorderWrapper}>
              <IconButton
                aria-label="cancelRecording"
                component="span"
                fontSize="large"
                disabled={loading}
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
                disabled={loading || !pastOneSecond}
              >
                <CheckCircleOutlineIcon className={pastOneSecond ? classes.sendAudioIcon : classes.disabledIcon} />
              </IconButton>
            </div>

          )
            :
            <>
              {medias.length > 0 ?
                <>
                  <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                    <IconButton
                      aria-label="cancel-upload"
                      component="span"
                      onClick={(e) => setMedias([])}
                    >
                      <CancelIcon className={classes.sendMessageIcons} />
                    </IconButton>

                    {loading ? (
                      <div>
                        <CircularProgress className={classes.circleLoading} />
                      </div>
                    ) : (
                      <span>
                        {medias[0]?.name}
                      </span>
                    )}
                    <IconButton
                      aria-label="send-upload"
                      component="span"
                      onClick={handleSendMedia}
                      disabled={loading}
                    >
                      <SendIcon className={classes.sendMessageIcons} />
                    </IconButton>
                  </Paper>
                </>
                :
                <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                  <FileInput disableOption={loading} handleChangeMedias={handleChangeMedias} />
                  <div className={classes.messageInputWrapper}>
                    <InputBase
                      multiline
                      value={contentMessage}
                      onKeyUp={(e) => {
                        if (e.key === "Enter" && contentMessage.trim() !== "") {

                          handleSendMessage(contentMessage);
                          setContentMessage("");
                        }
                      }}
                      placeholder={i18n.t("messagesInput.placeholderOpen")}
                      onChange={(e) => setContentMessage(e.target.value)}
                      className={classes.messageInput}
                    />
                  </div>
                        {contentMessage ? (
                          <IconButton
                            onClick={() => {
                              if (contentMessage.trim() !== "") {
                                handleSendMessage(contentMessage);
                                setContentMessage("");
                              }
                            }}
                            className={classes.buttonSend}
                          >
                            <SendIcon />
                          </IconButton>

                        )
                          : (
                            <IconButton
                              aria-label="showRecorder"
                              component="span"
                              disabled={loading}
                              onClick={handleStartRecording}
                            >
                              <MicIcon className={classes.buttonSend} />
                            </IconButton>
                          )

                        }
                  
                </Paper>
              }
            </>
          }

        </FormControl>
      </div>
    </Paper>
  );
}

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
          <AttachFileIcon className={classes.buttonSend} />
        </IconButton>
      </label>
    </>
  );
};