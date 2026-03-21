import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
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
import { GetApp } from "@material-ui/icons";
import toastError from "../../errors/toastError";
import MicRecorder from "mic-recorder-to-mp3";
import MicIcon from "@material-ui/icons/Mic";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import CropFreeIcon from "@material-ui/icons/CropFree";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import RecordingTimer from "../../components/MessageInputCustom/RecordingTimer";
import MediaGalleryLightbox, { buildMediaGalleryData } from "../../components/MediaGalleryLightbox";

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
  },
  inputArea: {
    position: "relative",
    height: "auto",
  },
  input: {
    padding: "20px",
  },
  buttonSend: {
    margin: theme.spacing(1),
  },
  boxLeft: {
    padding: "10px 10px 5px",
    margin: "10px",
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
    padding: "10px 10px 5px",
    margin: "10px 10px 10px auto",
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
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
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
  videoPreviewWrapper: {
    width: 250,
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  videoPreviewMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  videoPreviewActions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    display: "flex",
    gap: 8,
    zIndex: 1,
  },
  videoPreviewActionButton: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    color: "#fff",
    "&:hover": {
      backgroundColor: "rgba(15, 23, 42, 0.82)",
    },
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

}));

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

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
  const { datetimeToClient } = useDate();
  const baseRef = useRef();
  const previewVideoRefs = useRef({});

  const [contentMessage, setContentMessage] = useState("");
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [previewVideoPlayingById, setPreviewVideoPlayingById] = useState({});

  const lightboxMedia = useMemo(() => {
    return buildMediaGalleryData(messages, {
      getMediaUrl: (message) => message?.mediaPath,
    });
  }, [messages]);

  const openLightboxForMessage = (messageId) => {
    const index = lightboxMedia.byMessageId[messageId];
    if (index === undefined) {
      return;
    }

    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

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

  const handleVideoPreviewPlayClick = (event, messageId) => {
    event.stopPropagation();

    const previewVideo = previewVideoRefs.current[messageId];
    if (!previewVideo) {
      return;
    }

    if (previewVideo.paused) {
      previewVideo.play().catch(() => { });
      return;
    }

    previewVideo.pause();
  };

  const pausePreviewVideo = (messageId) => {
    const previewVideo = previewVideoRefs.current[messageId];
    if (!previewVideo) {
      return;
    }

    previewVideo.pause();
  };

  const checkMessageMedia = (message) => {
    const mediaUrl = message.mediaPath;

    if (message.mediaType === "image") {
      return (
        <img
          className={classes.messageMedia}
          src={mediaUrl}
          alt="midia da mensagem"
          style={{ cursor: "pointer" }}
          onClick={() => openLightboxForMessage(message.id)}
        />
      );
    }
    if (message.mediaType === "audio") {
      return (
        <audio controls>
          <source src={mediaUrl} type="audio/ogg"></source>
        </audio>
      );
    }

    if (message.mediaType === "video") {
      return (
        <div className={classes.videoPreviewWrapper}>
          <video
            ref={(element) => {
              if (element) {
                previewVideoRefs.current[message.id] = element;
              } else {
                delete previewVideoRefs.current[message.id];
              }
            }}
            className={classes.videoPreviewMedia}
            src={mediaUrl}
            preload="metadata"
            playsInline
            onPlay={() => {
              setPreviewVideoPlayingById((previous) => ({
                ...previous,
                [message.id]: true,
              }));
            }}
            onPause={() => {
              setPreviewVideoPlayingById((previous) => ({
                ...previous,
                [message.id]: false,
              }));
            }}
            onEnded={() => {
              setPreviewVideoPlayingById((previous) => ({
                ...previous,
                [message.id]: false,
              }));
            }}
          />
          <div className={classes.videoPreviewActions}>
            <IconButton
              className={classes.videoPreviewActionButton}
              aria-label="play preview"
              onClick={(event) => handleVideoPreviewPlayClick(event, message.id)}
            >
              {previewVideoPlayingById[message.id] ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton
              className={classes.videoPreviewActionButton}
              aria-label="open video lightbox"
              onClick={(event) => {
                event.stopPropagation();
                pausePreviewVideo(message.id);
                openLightboxForMessage(message.id);
              }}
            >
              <CropFreeIcon />
            </IconButton>
          </div>
        </div>
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
              href={mediaUrl}
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
      formData.append("body", media.name);
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
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();

      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-${new Date().getTime()}.mp3`;

      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      await api.post(`/chats/${chat.id}/messages`, formData);
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {Array.isArray(messages) &&
          messages.map((item, key) => {
            if (item.senderId === user.id) {
              return (
                <Box key={key} className={classes.boxRight}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  {item.mediaPath && checkMessageMedia(item)}
                  {item.message}
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
              );
            } else {
              return (
                <Box key={key} className={classes.boxLeft}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  {item.mediaPath && checkMessageMedia(item)}
                  {item.message}
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
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
                disabled={loading}
              >
                <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
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
                <React.Fragment>
                  <Input
                    multiline
                    value={contentMessage}
                    onKeyUp={(e) => {
                      if (e.key === "Enter" && contentMessage.trim() !== "") {

                        handleSendMessage(contentMessage);
                        setContentMessage("");
                      }
                    }}
                    onChange={(e) => setContentMessage(e.target.value)}
                    className={classes.input}
                    startAdornment={
                      <InputAdornment position="start">
                        <FileInput disableOption={loading} handleChangeMedias={handleChangeMedias} />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
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
                              <MicIcon className={classes.sendMessageIcons} />
                            </IconButton>
                          )

                        }
                      </InputAdornment>
                    }
                  />
                </React.Fragment>
              }
            </>
          }

        </FormControl>
      </div>
      <MediaGalleryLightbox
        open={lightboxOpen}
        onClose={closeLightbox}
        index={lightboxIndex}
        slides={lightboxMedia.slides}
      />
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
          <AttachFileIcon className={classes.sendMessageIcons} />
        </IconButton>
      </label>
    </>
  );
};