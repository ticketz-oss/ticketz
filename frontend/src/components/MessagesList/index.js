import React, { useState, useEffect, useReducer, useRef, useContext } from "react";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { green, blue } from "@material-ui/core/colors";
import {
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";

import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Facebook,
  Instagram,
  Description,
  Forward
} from "@material-ui/icons";

import WhatsMarked from "react-whatsmarked";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";
import vCard from "vcard-parser";
import { generateColor } from "../../helpers/colorGenerator";
import { URLCharEncoder } from "../../helpers/URLCharEncoder";
import { getInitials } from "../../helpers/getInitials";
import { Mutex } from "async-mutex";

const loadPageMutex = new Mutex();

const useStyles = makeStyles((theme) => ({
  messageContainer: {
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: "bold",
      textDecoration: "none",
    },
    marginBottom: 5,
  },
  
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  messagesList: {
    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  circleLoading: {
    color: green[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.mode === 'light' ? "#ffffff" : "#024481",
    color: theme.mode === 'light' ? "#303030" : "#ffffff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000",
    transition: 'background-color 0.5s ease-in-out',
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: theme.mode === 'light' ? "#f0f0f0" : "#1c2134",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
    cursor: "pointer",
  },

  quotedMsg: {
    padding: 10,
    // maxWidth: 300,
    width: "100%",
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  quotedThumbnail: {
    maxWidth: "180px",
    height: "90px",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: theme.mode === 'light' ? "#dcf8c6" : "#005c4b",
    color: theme.mode === 'light' ? "#303030" : "#ffffff",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000",
    transition: 'background-color 0.5s ease-in-out',
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: theme.mode === 'light' ? "#cfe9ba" : "#075e54",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    // maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  
  forwardedMessage: {
    display: "flex",
    color: theme.mode === 'light' ? "#999" : "#d0d0d0",
    fontSize: 11,
    fontWeight: 'bold'
  },

  forwardedIcon: {
    color: theme.mode === 'light' ? "#999" : "#d0d0d0",
    fontSize: 15,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  textContentItemEdited: {
    overflowWrap: "break-word",
    padding: "3px 120px 6px 6px",
  },

  messageVideo: {
    width: 250,
    maxHeight: 445,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  messageMediaSticker: {
    backgroundColor: "unset",
    boxShadow: "unset",
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: theme.mode === 'light' ? "#999" : "#d0d0d0"
  },

  timestampStickerLeft: {
    backgroundColor: theme.mode === 'light' ? "#ffffff" : "#024481",
    borderRadius: 8,
    padding: 5,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  timestampStickerRight: {
    backgroundColor: theme.mode === 'light' ? "#dcf8c6" : "#128c7e",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: theme.palette.backgroundContrast.paper,
    margin: "10px",
    borderRadius: "10px",
    boxShadow: `0 1px 1px ${theme.palette.backgroundContrast.border}`,
  },

  dailyTimestampText: {
    color: theme.palette.textCommon.main,
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  ackDoneReadIcon: {
    color: blue[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
  imageLocation: {
    position: 'relative',
    width: '100%',
    height: 80,
    borderRadius: 5
  },

  '@global': {
    '@keyframes wave': {
      '0%, 60%, 100%': {
        transform: 'initial',
      },
      '30%': {
        transform: 'translateY(-15px)',
      },
    },
    '@keyframes quiet': {
      '25%': {
        transform: 'scaleY(.6)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(.8)',
      }
    },
    '@keyframes normal': {
      '25%': {
        transform: 'scaleY(.1)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(.6)',
      }
    },
    '@keyframes loud': {
      '25%': {
        transform: 'scaleY(1)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(1.2)',
      }
    },
  },
  wave: {
    position: 'relative',
    textAlign: 'center',
    height: "30px",
    marginTop: "10px",
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  dot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    marginRight: "3px",
    background: theme.mode === 'light' ? "#303030" : "#ffffff",
    animation: "wave 1.3s linear infinite",
    "&:nth-child(2)": {
      animationDelay: "-1.1s",
    },
    "&:nth-child(3)": {
      animationDelay: "-0.9s",
    }
  },

  wavebarsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    height: "30px",
    marginTop: "5px",
    marginBottom: "5px",
    marginLeft: "auto",
    marginRight: "auto",
    "--boxSize": "5px",
    "--gutter": "4px",
    width: "calc((var(--boxSize) + var(--gutter)) * 5)",
  },

  wavebars: {
    transform: "scaleY(.4)",
    height: "100%",
    width: "var(--boxSize)",
    animationDuration: "1.2s",
    backgroundColor: theme.mode === 'light' ? "#303030" : "#ffffff",
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    borderRadius: '8px',
  },

  wavebar1: {
    animationName: 'quiet'
  },
  wavebar2: {
    animationName: 'normal'
  },
  wavebar3: {
    animationName: 'quiet'
  },
  wavebar4: {
    animationName: 'loud'
  },
  wavebar5: {
    animationName: 'quiet'
  },
  linkPreviewThumbnail: {
    width: "328px",
    height: "172px",
  },
  linkPreviewTitle: {
    fontWeight: "bold",
    marginBottom: "4px"
  },
  linkPreviewDescription: {
    marginBottom: "4px"
  },
  linkPreviewUrl: {
    opacity: 0.6
  },
  linkPreviewAnchor: {
    textDecoration: "none",
    color: theme.mode === 'light' ? "#303030" : "#ffffff",
  },
  messageHighlighted: {
    backgroundColor: theme.palette.primary.main,
  },
  previewThumbnail: {
    width: "383px",
  },
  audioBottom: {
    marginBottom: "12px",
  },
  reactionsContainer: {
    width: "fit-content",
    height: 1,
    marginLeft: "auto",
    marginRight: "auto",
  },
  reactions: {
    top: -8,
    display: "ruby",
    position: "relative",
    zIndex: 1,
    maxWidth: "75%",
    paddingTop: 3,
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 3,
    borderRadius: 15,
    backgroundColor: "gray",
    cursor: "default"
  },
  mediaDescription: {
    padding: 5,
    marginBottom: 5,
    borderLeft: "5px solid",
    borderColor: theme.mode === 'light' ? "#000" : "#fff",
  }
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {

      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    if (newMessage.mediaType === "reactionMessage") {
      const reactionIndex = state.findIndex((m) => m.id === newMessage.quotedMsgId);
      if (reactionIndex !== -1) {
        state[reactionIndex].replies = state[reactionIndex].replies || [];
        state[reactionIndex].replies.push(newMessage);
      }
    }
    
    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({ ticket, ticketId, isGroup, markAsRead }) => {
  const classes = useStyles();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const [selectedMessageData, setSelectedMessageData] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const [contactPresence, setContactPresence] = useState("available");

  const socketManager = useContext(SocketContext);

  function loadData(incrementPage = false) {
    setLoading(true);
    const thisPageNumber = incrementPage ? pageNumber + 1 : 1;
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber: thisPageNumber, markAsRead },
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setLoading(false);
          }

          if (pageNumber === 1 && data.messages.length > 1) {
            scrollToBottom();
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
      setPageNumber(thisPageNumber);
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }

  useEffect(async () => {
    dispatch({ type: "RESET" });
    setContactPresence("available");

    currentTicketId.current = ticketId;
    
    await loadPageMutex.runExclusive(async () => {
      loadData();
    });
  }, [ticketId]);

  useEffect(() => {
    if (!ticket.id) {
      return;
    }

    const companyId = localStorage.getItem("companyId");

    const socket = socketManager.GetSocket(companyId);

    const onConnect = () => {
      socket.emit("joinChatBox", `${ticket.id}`);
    }

    socketManager.onConnect(onConnect);

    const onAppMessage = (data) => {
      if (data.message.ticketId === currentTicketId.current) {
        setContactPresence("available");
        if (data.action === "create") {
          dispatch({ type: "ADD_MESSAGE", payload: data.message });
          if (data.message.mediaType !== "reactionMessage") {
            scrollToBottom();
          } 
        }

        if (data.action === "update") {
          dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        }
      }
    }

    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    socket.on(`company-${companyId}-presence`, (data) => {
      const { scrollTop, clientHeight, scrollHeight } = scrollRef.current;
      console.log({ presence: data.presence, scrollTop, clientHeight, scrollHeight });
      const isAtBottom = scrollTop + clientHeight >= (scrollHeight - clientHeight / 4);
      if (data?.ticketId === ticket.id) {
        setContactPresence(data.presence);
        if (["composing", "recording"].includes(data.presence)) {
          if (isAtBottom) {
            scrollToBottom();
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, socketManager]);

  const loadMore = async () => {
    await loadPageMutex.runExclusive(async () => {
      loadData(true);
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = (e) => {
    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (loading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message, data) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
    setSelectedMessageData(data);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const checkMessageMedia = (message, data) => {
    const document =
      data?.message?.documentMessage
      || data?.message?.documentWithCaptionMessage?.message?.documentMessage;
    if (!document && message.mediaType === "image") {
      return (
        <>
          { <ModalImageCors imageUrl={message.mediaUrl} isDeleted={message.isDeleted} /> }
          <>
            <div className={[clsx({
              [classes.textContentItemDeleted]: message.isDeleted,
              [classes.textContentItem]: !message.isDeleted,
            }),]}>
              {data?.message?.imageMessage?.caption &&
                <>
                  <WhatsMarked>
                    {data.message.imageMessage.caption}
                  </WhatsMarked>
                </>
              }
            </div>
          </>
        </>
      )
    }
    if (!document && message.mediaType === "audio") {

      return (
        <>
          <audio className={classes.audioBottom} controls>
            <source src={message.mediaUrl} type="audio/ogg"></source>
          </audio>
          {
            message.body &&
            !message.body.startsWith("Áudio") &&
            <div className={classes.mediaDescription}>
              {message.body}
            </div>
          }
        </>
      );
    }

    if (!document || message.mediaType === "video") {
      return (
        <video
          className={classes.messageVideo}
          src={message.mediaUrl}
          controls
        />
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<Description />}
              endIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={URLCharEncoder(message.mediaUrl)}
            >
             { document?.fileName || message.body}
            </Button>
          </div>
          {message.body !== document?.fileName &&
            <>
              <div className={[clsx({
                [classes.textContentItemDeleted]: message.isDeleted,
              }),]}>
                <WhatsMarked>
                  { message.body }
                </WhatsMarked>
              </div>
            </>
          }
        </>
      );
    }
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 2) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3) {
      return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />;
    }
    if (message.ack === 4) {
      return <DoneAll fontSize="small" className={classes.ackDoneReadIcon} />;
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const scrollToMessage = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });

      // Add the highlight class
      element.classList.add(classes.messageHighlighted);

      // Remove the highlight class after 2 seconds
      setTimeout(() => {
        element.classList.remove(classes.messageHighlighted);
      }, 2000);
    }
  };

  const getQuotedMessageText = (quotedMsg) => {
    if (!quotedMsg?.body && quotedMsg?.mediaUrl) {
      return "📎 " + quotedMsg.mediaUrl.split("/").pop();
    }

    if (isVCard(quotedMsg?.body)) {
      return "🪪";
    }
    
    return quotedMsg?.body;
  }
    

  const renderQuotedMessage = (message) => {
    const data = JSON.parse(message.quotedMsg.dataJson);
    
    const thumbnail = data?.message?.imageMessage?.jpegThumbnail;
    const mediaUrl = message.quotedMsg?.mediaType === "image" ? message.quotedMsg.mediaUrl : null;
    const imageUrl = thumbnail ? "data:image/png;base64, " + thumbnail : mediaUrl;
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
        onClick={() => scrollToMessage(message.quotedMsg.id)}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}
          <WhatsMarked>{getQuotedMessageText(message.quotedMsg)}</WhatsMarked>
        </div>
        {imageUrl && (
          <img className={classes.quotedThumbnail} src={imageUrl} />
        )}
      </div>
    );
  };

  const renderReplies = (replies) => {
    const reactions = replies &&
      replies.filter(
        (reply) => reply?.mediaType === "reactionMessage"
      ).map((reply) => {
        return (
          reply.contact?.name ?
            <Tooltip title={reply.contact?.name} placement="top" arrow >
              <div
                key={reply.id}
              >
                {reply.body}
              </div>
            </Tooltip>
            :
            <div
              key={reply.id}
            >
              {reply.body}
            </div>
        )
      });

    return (
      reactions?.length > 0 && <div className={classes.reactionsContainer}>
        <div className={classes.reactions}>
          {reactions}
        </div>
      </div>
    );
  }
  
  const renderLinkPreview = (message) => {
    const data = JSON.parse(message.dataJson);
    
    const title = data?.message?.extendedTextMessage?.title;
    const description = data?.message?.extendedTextMessage?.description;
    const canonicalUrl = data?.message?.extendedTextMessage?.canonicalUrl;
    const url = canonicalUrl && new URL(
      canonicalUrl,
    );
    
    if (!title && !description && !url) {
      return (<></>);
    }
    
    const thumbnail = data?.message?.extendedTextMessage?.jpegThumbnail;
    const imageUrl = thumbnail ? "data:image/png;base64, " + thumbnail : "";
    return (
      <a href={canonicalUrl} className={classes.linkPreviewAnchor} target="_blank">
        <div
          className={clsx(classes.quotedContainerLeft, {
            [classes.quotedContainerRight]: message.fromMe,
          })}
        >
          <div className={classes.quotedMsg}>
            {title &&
              <div className={classes.linkPreviewTitle}>
                {title}
              </div>
            }
            {description &&
              <div className={classes.linkPreviewDescription}>
                {description}
              </div>
            }
            {url?.hostname &&
              <div className={classes.linkPreviewUrl}>
                {url.hostname}
              </div>
            }
          </div>
          {!message.thumbnailUrl && imageUrl && (
            <img className={classes.quotedThumbnail} src={imageUrl} />
          )}
        </div>
      </a>
    );
  };

  const formatVCardN = (n) => {
    return(
      (n[3] ? n[3] + " " : "") +
      (n[1] ? n[1] + " " : "") +
      (n[2] ? n[2] + " " : "") +
      (n[0] ? n[0] + " " : "") +
      (n[4] ? n[4] + " " : "")
    );
  }

  const isVCard = (message) => {
    return message.startsWith('{"ticketzvCard":');
  };
  
  const stringOrFirstElement = (data) => {
    if (!data) {
      return "";
    }
    if (Array.isArray(data)) {
      return data[0];
    }
    return data;
  };

  const renderVCard = (vcardJson) => {
    const cardArray = JSON.parse(vcardJson)?.ticketzvCard;
    
    if (!cardArray || !Array.isArray(cardArray)) {
      return <div>Invalid VCARD data</div>;
    }

    return cardArray.map((item) => {
      const message = item?.vcard;
      if (!message) {
        return <></>;
      }
      const parsedVCard = vCard.parse(message);
      console.debug("vCard data:", { message , parsedVCard });
      
      const name = stringOrFirstElement(
        parsedVCard['X-WA-BIZ-NAME']?.[0]?.value ||
        parsedVCard.fn?.[0]?.value ||
        formatVCardN(parsedVCard.n?.[0]?.value));
      const description = stringOrFirstElement(
        parsedVCard['X-WA-BIZ-DESCRIPTION']?.[0]?.value || "");
      const number = stringOrFirstElement(parsedVCard?.tel?.[0]?.value);
      const metaNumber = parsedVCard?.tel?.[0]?.meta?.waid?.[0] || number || "unknown";
      
      return (
        <div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
            <Avatar style={{ backgroundColor: generateColor(metaNumber), marginRight: 10, marginLeft: 20, width: 60, height: 60, color: "white", fontWeight: "bold" }}>{ getInitials(name)}</Avatar>
            <div style={{ width: 350 }}>
              <div>
                <Typography
                  noWrap
                  component="h4"
                  variant="body2"
                  color="textPrimary"
                  style={{ fontWeight: '700' }}
                >
                  {name}
                </Typography>
              </div>

              <div style={{ width: 350 }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                  style={{ display: 'flex' }}
                >
                  {description}
                </Typography>
              </div>

              <div style={{ width: 350 }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                  style={{ display: 'flex' }}
                >
                  {number}
                </Typography>
              </div>

            </div>

          </div>
          <div style={{
            width: '100%', display: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            borderWidth: '1px 0 0 0',
            borderTopColor: '#bdbdbd',
            borderStyle: 'solid',
            padding: 8
          }}>
            <Typography
              noWrap
              component="h4"
              variant="body2"
              color="textPrimary"
              style={{ fontWeight: '700', color: '#2c9ce7' }}
            >
              Conversar
            </Typography>
          </div>
        </div>
      )

    });
  };

  const messageLocation = (message, createdAt) => {
    return (
      <div className={[classes.textContentItem, { display: 'flex', padding: 5 }]}>
        <img src={message.split('|')[0]} className={classes.imageLocation} />
        <a
          style={{ fontWeight: '700', color: 'gray' }}
          target="_blank"
          href={message.split('|')[1]}> Clique para ver localização</a>
        <span className={classes.timestamp}>
          {format(parseISO(createdAt), "HH:mm")}
        </span>
      </div>
    )
  };

  const getDataContextInfo = (data) => {
    if (!data) {
      return null;
    }

    return data.message?.extendedTextMessage?.contextInfo ||
      data.message?.imageMessage?.contextInfo ||
      data.message?.videoMessage?.contextInfo ||
      data.message?.audioMessage?.contextInfo ||
      data.message?.documentMessage?.contextInfo ||
      data.message?.stickerMessage?.contextInfo ||
      data.message?.productMessage?.contextInfo ||
      data.message?.locationMessage?.contextInfo ||
      data.message?.liveLocationMessage?.contextInfo ||
      data.message?.contactMessage?.contextInfo ||
      data.message?.listMessage?.contextInfo ||
      data.message?.buttonsResponseMessage?.contextInfo ||
      data.message?.paymentMessage?.contextInfo ||
      data.message?.orderMessage?.contextInfo ||
      data.message?.productCatalogMessage?.contextInfo ||
      data.message?.templateButtonReplyMessage?.contextInfo ||
      data.message?.templateMessage?.contextInfo ||
      data.message?.documentWithCaptionMessage?.contextInfo || null;
  };
        
  const renderMessages = () => {
    const viewMessagesList = messagesList.map((message, index) => {
      if (message.mediaType === "reactionMessage") {
        return;
      }
      const data = JSON.parse(message.dataJson);
      const dataContext = getDataContextInfo(data);
      const isSticker = data?.message && ("stickerMessage" in data.message);
      if (!message.fromMe) {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div id={message.id}
              className={[clsx(classes.messageContainer, classes.messageLeft, {
                [classes.messageMediaSticker]: isSticker,
              })]}
              title={message.queueId && message.queue?.name}
            >
              <IconButton
                variant="contained"
                size="small"
                id={`messageActionsButton-${message.id}`}
                disabled={message.isDeleted}
                className={classes.messageActionsButton}
                onClick={(e) => handleOpenMessageOptionsMenu(e, message, data)}
              >
                <ExpandMore />
              </IconButton>
              { dataContext?.isForwarded && (
                <span className={classes.forwardedMessage}>
                  <Forward fontSize="small" className={classes.forwardedIcon}/> {i18n.t("message.forwarded")}
                </span>
              )}
              {isGroup && (
                <span className={classes.messageContactName}>
                  {message.contact?.name}
                </span>
              )}

              {message.thumbnailUrl && (
                <img className={classes.previewThumbnail} src={message.thumbnailUrl} />
              )}

              {message.body.includes('data:image') ? messageLocation(message.body, message.createdAt)
                :
                isVCard(message.body) ?
                  <div
                    className={[clsx(classes.textContentItem, {
                      [classes.textContentItemEdited]: message.isEdited
                    }), { marginRight: 0 }]}>
                    {renderVCard(message.body)}
                  </div>

                  :

                  (<div className={[clsx(classes.textContentItem, {
                    [classes.textContentItemDeleted]: message.isDeleted,
                    [classes.textContentItemEdited]: message.isEdited
                  }),]}>
                    {message.quotedMsg && renderQuotedMessage(message)}
                    {renderLinkPreview(message)}
                    {!isSticker && (
                      message.mediaUrl && !data?.message?.extendedTextMessage ?
                        ""
                        :
                        <>
                          {message.isDeleted && (
                            <Block
                              color="disabled"
                              fontSize="small"
                              className={classes.deletedIcon}
                            />
                          )}
                          <WhatsMarked>
                            {message.body}
                          </WhatsMarked>
                        </>
                    )
                    }
                    <span className={[clsx(classes.timestamp, {
                      [classes.timestampStickerLeft]: isSticker
                    })]}>
                      {message.isEdited && <span> {i18n.t("message.edited")} </span>}
                      {format(parseISO(message.createdAt), "HH:mm")}
                    </span>
                  </div>)}
                  {message.mediaUrl && !data?.message?.extendedTextMessage && checkMessageMedia(message, data)}
                  {renderReplies(message.replies)}
            </div>
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div id={message.id}
              className={[clsx(classes.messageContainer, classes.messageRight, {
                [classes.messageMediaSticker]: isSticker,
              })]}
              title={message.queueId && message.queue?.name}
            >
              <IconButton
                variant="contained"
                size="small"
                id={`messageActionsButton-${message.id}`}
                disabled={message.isDeleted}
                className={classes.messageActionsButton}
                onClick={(e) => handleOpenMessageOptionsMenu(e, message, data)}
              >
                <ExpandMore />
              </IconButton>

              { dataContext?.isForwarded && (
                <span className={classes.forwardedMessage}>
                   <Forward fontSize="small" className={classes.forwardedIcon}/> {i18n.t("message.forwarded")}
                </span>
              )}

              {message.thumbnailUrl && (
                <img className={classes.previewThumbnail} src={message.thumbnailUrl} />
              )}                                

              <div
                className={clsx(classes.textContentItem, {
                  [classes.textContentItemDeleted]: message.isDeleted,
                  [classes.textContentItemEdited]: message.isEdited,
                })}
              >
                {message.isDeleted && (
                  <Block
                    color="disabled"
                    fontSize="small"
                    className={classes.deletedIcon}
                  />
                )}

                {message.body.includes('data:image') ? messageLocation(message.body, message.createdAt)
                  :
                  isVCard(message.body) ?
                    <div className={[classes.textContentItem]}>
                      {renderVCard(message.body)}
                    </div>

                    :
                    message.quotedMsg && renderQuotedMessage(message)}
                {renderLinkPreview(message)}
                {!isSticker && (
                  message.mediaUrl ? "" : <WhatsMarked>{message.body}</WhatsMarked>
                )
                }
                <span className={[clsx(classes.timestamp, {
                  [classes.timestampStickerRight]: isSticker
                })]}>
                  {message.isEdited && <span> {i18n.t("message.edited")} </span>}
                  {format(parseISO(message.createdAt), "HH:mm")}
                  {renderMessageAck(message)}
                </span>
              </div>
              {message.mediaUrl && checkMessageMedia(message, data)}
              {renderReplies(message.replies)}
            </div>
          </React.Fragment>
        );
      }
    });
    return viewMessagesList;
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        data={selectedMessageData}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {messagesList.length > 0 ? renderMessages() : []}
        {contactPresence === "composing" && (
          <div className={classes.messageLeft}>
            <div className={classes.wave}>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
            </div>
          </div>
        )}
        {contactPresence === "recording" && (
          <div className={classes.messageLeft}>
            <div className={classes.wavebarsContainer}>
              <div className={clsx(classes.wavebars, classes.wavebar1)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar2)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar3)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar4)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar5)}></div>
            </div>
          </div>
        )}
      </div>
      {ticket?.channel !== "whatsapp" || ticket.channel === undefined && (
        <div
          style={{
            width: "100%",
            display: "flex",
            padding: "10px",
            alignItems: "center",
            backgroundColor: "#E1F3FB",
          }}
        >
          {ticket?.channel === "facebook" ? (
            <Facebook small />
          ) : (
            <Instagram small />
          )}

          <span>
            Você tem 24h para responder após receber uma mensagem, de acordo
            com as políticas do Facebook.
          </span>
        </div>
      )}
      {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;