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
} from "@material-ui/icons";

import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";


const useStyles = makeStyles((theme) => ({
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
    "&:hover #messageActionsButton": {
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
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: theme.mode === 'light' ? "#f0f0f0" : "#1c2134",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
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
    maxWidth: "74px",
    maxHeight: "74px",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
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
    boxShadow: theme.mode === 'light' ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
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
    maxWidth: 300,
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

  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
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
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
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

const MessagesList = ({ ticket, ticketId, isGroup }) => {
  const classes = useStyles();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const [selectedMessageData, setSelectedMessageData] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);

    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber },
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
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId]);

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
	  console.log("AppMessage", data);
      if (data.action === "create" && data.message.ticketId === currentTicketId.current) {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update" && data.message.ticketId === currentTicketId.current) {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }
    }

    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, socketManager]);

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
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
    if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaUrl} isDeleted={message.isDeleted} data={data} />;
    }
    if (message.mediaType === "audio") {
    
      return (
        <audio controls>
          <source src={message.mediaUrl} type="audio/ogg"></source>
        </audio>
      );
    }

    if (message.mediaType === "video") {
      return (
        <video
          className={classes.messageMedia}
          src={message.mediaUrl}
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
              href={message.mediaUrl}
            >
              Download
            </Button>
          </div>
          <Divider />
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
    if (index < messagesList.length - 1) {
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
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
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

  const renderQuotedMessage = (message) => {
    const data = JSON.parse(message.quotedMsg.dataJson);
    const thumbnail = data?.message?.imageMessage?.jpegThumbnail;
    const stickerUrl = data?.message?.stickerMessage && message.quotedMsg?.mediaUrl ;
    const imageUrl = thumbnail ? "data:image/png;base64, " + thumbnail : stickerUrl;
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
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
          {message.quotedMsg?.body}
        </div>
        { imageUrl && (
          <img className={classes.quotedThumbnail} src={ imageUrl } />
        )}
      </div>
    );
  };

  const isVCard = (message) => {
    return message.includes('BEGIN:VCARD');
  };

  const vCard = (message) => {
    const name = message?.substring(message.indexOf("N:;") + 3, message.indexOf(";;;"))
    const description = message?.substring(message.indexOf("TION:") + 5, message.indexOf("TEL"))
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
          <Avatar style={{ marginRight: 10, marginLeft: 20, width: 60, height: 60 }} />
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
          </div>

        </div>
        <div style={{
          width: '100%', display: 'flex',
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


  const renderMessages = () => {
      const viewMessagesList = messagesList.map((message, index) => {
        const data = JSON.parse(message.dataJson);
        const isSticker = data?.message && ("stickerMessage" in data.message); 
        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={[clsx(classes.messageLeft, {
                  [classes.messageMediaSticker] : isSticker,
                })]}
                title={message.queueId && message.queue?.name}
              >
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}

                {message.mediaUrl && checkMessageMedia(message, data)}

                {message.body.includes('data:image') ? messageLocation(message.body, message.createdAt)
                  :
                  isVCard(message.body) ?
                    <div
                      className={[clsx(classes.textContentItem, {
                        [classes.textContentItemEdited] : message.isEdited
                      }), { marginRight: 0 }]}>
                      {vCard(message.body)}
                    </div>

                    :


                    (<div className={[clsx(classes.textContentItem, {
                        [classes.textContentItemDeleted] : message.isDeleted,
                        [classes.textContentItemEdited] : message.isEdited
                    }), ]}>
                      {message.quotedMsg && renderQuotedMessage(message)}
                      {message.isDeleted && (
                        <Block
                          color="disabled"
                          fontSize="small"
                          className={classes.deletedIcon}
                        />
                      )}
                      { !isSticker && (
                        <MarkdownWrapper>{message.body}</MarkdownWrapper>
                        )
                      }
                      <span className={[clsx(classes.timestamp, {
                        [classes.timestampStickerLeft] : isSticker
                      })]}>
                        {message.isEdited && <span> {i18n.t("message.edited")} </span>}
                        {format(parseISO(message.createdAt), "HH:mm")}
                      </span>
                    </div>)}
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={[clsx(classes.messageRight, {
                  [classes.messageMediaSticker] : isSticker,
                })]}
                title={message.queueId && message.queue?.name}
              >
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
                {message.mediaUrl && checkMessageMedia(message, data)}
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
                      {vCard(message.body)}
                    </div>

                    :
                  message.quotedMsg && renderQuotedMessage(message)}
                  { !isSticker && (
                    <MarkdownWrapper>{message.body}</MarkdownWrapper>
                    )
                  }
                    <span className={[clsx(classes.timestamp, {
                      [classes.timestampStickerRight] : isSticker
                    })]}>
                    {message.isEdited && <span> {i18n.t("message.edited")} </span>}
                    {format(parseISO(message.createdAt), "HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                </div>
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
      >
        {messagesList.length > 0 ? renderMessages() : []}
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