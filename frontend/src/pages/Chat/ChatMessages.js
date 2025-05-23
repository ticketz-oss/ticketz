import React, { useContext, useEffect, useRef, useState } from "react";
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
  CircularProgress,
} from "@material-ui/core";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Cancel as CancelIcon,
  GetApp,
  Mic as MicIcon,
  HighlightOff as HighlightOffIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@material-ui/icons";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";
import ModalImageCors from "../../components/ModalImageCors";
import toastError from "../../errors/toastError";
import MicRecorder from "mic-recorder-to-mp3";
import RecordingTimer from "../../components/MessageInputCustom/RecordingTimer";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderLeft: "1px solid rgba(0,0,0,0.12)",
    backgroundColor: "#ece5dd",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    backgroundImage: "url('/whatsapp-bg.png')",
    backgroundSize: "cover",
  },
  messageBox: {
    maxWidth: "60%",
    padding: "10px",
    borderRadius: "7.5px",
    marginBottom: "10px",
    wordBreak: "break-word",
    position: "relative",
  },
  sent: {
    marginLeft: "auto",
    backgroundColor: "#dcf8c6",
    borderBottomRightRadius: 0,
  },
  received: {
    marginRight: "auto",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 0,
  },
  inputArea: {
    padding: "10px",
    borderTop: "1px solid rgba(0,0,0,0.12)",
    backgroundColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    marginRight: "10px",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: "10px 15px",
  },
  uploadInput: {
    display: "none",
  },
  mediaPreview: {
    padding: "10px",
    backgroundColor: "#f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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

  const [contentMessage, setContentMessage] = useState("");
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottomRef.current = scrollToBottom;
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e) => {
    if (!pageInfo.hasMore || loading) return;
    if (e.currentTarget.scrollTop < 600) handleLoadMore();
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) return;
    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
  };

  const checkMessageMedia = (message) => {
    switch (message.mediaType) {
      case "image": return <ModalImageCors imageUrl={message.mediaPath} />;
      case "audio": return <audio controls src={message.mediaPath} />;
      case "video": return <video width="250" controls src={message.mediaPath} />;
      default:
        return (
          <Button startIcon={<GetApp />} href={message.mediaPath} target="_blank" download>
            Download
          </Button>
        );
    }
  };

  const handleSendMedia = async () => {
    setLoading(true);
    const formData = new FormData();
    medias.forEach((media) => {
      formData.append("medias", media);
      formData.append("body", media.name);
    });
    formData.append("fromMe", true);
    try {
      await api.post(`/chats/${chat.id}/messages`, formData);
      setMedias([]);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) throw new Error("Audio muito curto");

      const formData = new FormData();
      const filename = `audio-${Date.now()}.mp3`;
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
      await Mp3Recorder.stop();
    } catch {}
    setRecording(false);
  };

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            className={
              msg.senderId === user.id
                ? `${classes.messageBox} ${classes.sent}`
                : `${classes.messageBox} ${classes.received}`
            }
          >
            <Typography variant="body2">{msg.sender.name}</Typography>
            {msg.mediaPath && checkMessageMedia(msg)}
            <Typography variant="body1">{msg.message}</Typography>
            <Typography variant="caption">{datetimeToClient(msg.createdAt)}</Typography>
          </Box>
        ))}
        <div ref={baseRef} />
      </div>
      <div className={classes.inputArea}>
        {recording ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={handleCancelAudio}><HighlightOffIcon /></IconButton>
            <RecordingTimer />
            <IconButton onClick={handleUploadAudio}><CheckCircleOutlineIcon /></IconButton>
          </div>
        ) : medias.length > 0 ? (
          <div className={classes.mediaPreview}>
            <IconButton onClick={() => setMedias([])}><CancelIcon /></IconButton>
            <Typography>{medias[0]?.name}</Typography>
            <IconButton onClick={handleSendMedia}><SendIcon /></IconButton>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            <FileInput handleChangeMedias={handleChangeMedias} disableOption={loading} />
            <Input
              placeholder="Mensagem"
              value={contentMessage}
              onChange={(e) => setContentMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && contentMessage.trim()) {
                  handleSendMessage(contentMessage);
                  setContentMessage("");
                }
              }}
              className={classes.input}
            />
            {contentMessage ? (
              <IconButton onClick={() => {
                handleSendMessage(contentMessage);
                setContentMessage("");
              }}><SendIcon /></IconButton>
            ) : (
              <IconButton onClick={handleStartRecording}><MicIcon /></IconButton>
            )}
          </div>
        )}
      </div>
    </Paper>
  );
}

const FileInput = ({ handleChangeMedias, disableOption }) => {
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
        <IconButton component="span" disabled={disableOption}>
          <AttachFileIcon />
        </IconButton>
      </label>
    </>
  );
};
