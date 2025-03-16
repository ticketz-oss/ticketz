import React, { useContext, useState } from "react";
import {
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  makeStyles,
} from "@material-ui/core";

import { useHistory, useParams } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";

import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";

import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "calc(100% - 58px)",
    overflow: "hidden",
    borderRadius: 0,
    //backgroundColor: "inherit",
  },
  chatList: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
  },
  listItem: {
    cursor: "pointer",
    height: 96,
  },
  lastMessageTime: {
    position: "absolute",
    top: 0,
    right: 0,
    fontSize: 12,
    marginTop: 5,
    marginRight: 5,
  },
  actionButtons: {
    position: "absolute",
    bottom: -32,
    right: 0,
    top: "unset",
    height: 64,
    paddingTop: 32,
  },
  message: {
    display: "unset",
    textWrap: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  chip: {
    position: "absolute",
    right: 0,
    marginRight: 5,
  },
}));

export default function ChatList({
  chats,
  handleSelectChat,
  handleDeleteChat,
  handleEditChat,
  pageInfo,
  loading,
}) {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { simpleRelativePastTime } = useDate();

  const [confirmationModal, setConfirmModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState({});

  const { id } = useParams();

  const goToMessages = async (chat) => {
    if (unreadMessages(chat) > 0) {
      try {
        await api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }

    if (id !== chat.uuid) {
      history.push(`/chats/${chat.uuid}`);
      handleSelectChat(chat);
    }
  };

  const handleDelete = () => {
    handleDeleteChat(selectedChat);
  };

  const unreadMessages = (chat) => {
    const currentUser = chat.users.find((u) => u.userId === user.id);
    return currentUser.unreads;
  };

  const getItemStyle = (chat) => {
    return {
      borderLeft: chat.uuid === id ? "6px solid #002d6e" : "6px solid transparent",
     // backgroundColor: chat.uuid === id ? "#eee" : null,
    };
  };

  return (
    <>
      <ConfirmationModal
        title={"Excluir Conversa"}
        open={confirmationModal}
        onClose={setConfirmModalOpen}
        onConfirm={handleDelete}
      >
        Esta ação não pode ser revertida, confirmar?
      </ConfirmationModal>
      <div className={classes.mainContainer}>
        <div className={classes.chatList}>
          <List>
            <Divider component="li" />
            {Array.isArray(chats) &&
              chats.length > 0 &&
              chats.map((chat, key) => (
                <>
                  <ListItem
                    onClick={() => goToMessages(chat)}
                    key={key}
                    className={classes.listItem}
                    style={getItemStyle(chat)}
                    button
                  >
                    <Typography
                      className={classes.lastMessageTime}
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {simpleRelativePastTime(chat.updatedAt)}
                    </Typography>

                    <ListItemText className={classes.message}
                      primary={chat.title}
                      secondary={chat.lastMessage}
                    />

                    {unreadMessages(chat) > 0 && (
                      <Chip
                        className={classes.chip}
                        size="small"
                        style={{ marginLeft: 5 }}
                        label={unreadMessages(chat)}
                        color="secondary"
                      />
                    )}

                    <ListItemSecondaryAction className={classes.actionButtons}>
                      {chat.ownerId === user.id && (
                        <>
                          <IconButton
                            onClick={() => {
                              goToMessages(chat).then(() => {
                                handleEditChat(chat);
                              });
                            }}
                            edge="end"
                            aria-label="delete"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setSelectedChat(chat);
                              setConfirmModalOpen(true);
                            }}
                            edge="end"
                            aria-label="delete"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </>
              ))}
          </List>
        </div>
      </div>
    </>
  );
}
