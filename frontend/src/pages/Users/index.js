import StardewEmblem from "../../components/StardewEmblem";
import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Chip from "@material-ui/core/Chip";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import AvatarUsuario from "../../components/AvatarUsuario";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { filterUsersByQueue, groupUsersByProfile } from "./usersView";

const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];

    users.forEach(user => {
      const userIndex = state.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  queueFilter: {
    minWidth: 190
  },
  profileHeader: {
    backgroundColor: theme.palette.action.hover,
    "& td": {
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      fontWeight: 700,
      letterSpacing: 0.3
    }
  },
  profileHeaderContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  queueList: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(0.5)
  },
  queueChip: {
    maxWidth: 180
  },
  emptyCell: {
    padding: theme.spacing(5),
    color: theme.palette.text.secondary
  }
}));

const Users = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [queues, setQueues] = useState([]);
  const [users, dispatch] = useReducer(reducer, []);

  const socketManager = useContext(SocketContext);
  const { user: loggedInUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    };

    fetchQueues();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam, pageNumber }
          });
          dispatch({ type: "LOAD_USERS", payload: data.users });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyUser = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_USERS", payload: data.user });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_USER", payload: +data.userId });
      }
    };

    socket.on(`company-${companyId}-user`, onCompanyUser);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditUser = user => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async userId => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber(prevState => prevState + 1);
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const visibleUsers = filterUsersByQueue(users, selectedQueueId);
  const profileGroups = groupUsersByProfile(visibleUsers);

  const profileLabel = profile =>
    i18n.t(`users.profiles.${profile}`, { defaultValue: profile });

  const groupLabel = profile =>
    i18n.t(`users.groups.${profile}`, {
      defaultValue: profileLabel(profile)
    });

  return (
    <MainContainer className="sv-operations sv-screen-users">
      <ConfirmationModal
        title={
          deletingUser &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${
            deletingUser.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        aria-labelledby="form-dialog-title"
        userId={selectedUser && selectedUser.id}
      />
      <MainHeader>
        <StardewEmblem item="villager" />
        <Title>{i18n.t("users.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              )
            }}
          />
          <FormControl
            variant="outlined"
            margin="dense"
            className={classes.queueFilter}
          >
            <InputLabel id="users-queue-filter-label">
              {i18n.t("users.filters.queue")}
            </InputLabel>
            <Select
              labelId="users-queue-filter-label"
              id="users-queue-filter"
              value={selectedQueueId}
              onChange={event => setSelectedQueueId(event.target.value)}
              label={i18n.t("users.filters.queue")}
            >
              <MenuItem value="">
                <em>{i18n.t("users.filters.allQueues")}</em>
              </MenuItem>
              {queues.map(queue => (
                <MenuItem key={queue.id} value={queue.id}>
                  {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loggedInUser.profile === "admin" && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenUserModal}
            >
              {i18n.t("users.buttons.add")}
            </Button>
          )}
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">ID</TableCell>
              <TableCell align="center">{i18n.t("users.table.name")}</TableCell>
              <TableCell align="center">
                {i18n.t("users.table.email")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("users.table.profile")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("users.table.queues")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("users.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profileGroups.map(group => (
              <React.Fragment key={group.profile}>
                <TableRow
                  className={`${classes.profileHeader} sv-villager-group`}
                >
                  <TableCell colSpan={6}>
                    <div className={classes.profileHeaderContent}>
                      <span>{groupLabel(group.profile)}</span>
                      <Chip size="small" label={group.users.length} />
                    </div>
                  </TableCell>
                </TableRow>
                {group.users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell align="center">{user.id}</TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}
                      >
                        <AvatarUsuario usuario={user} preview />
                        <strong>{user.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell align="center">{user.email}</TableCell>
                    <TableCell align="center">
                      {profileLabel(user.profile || "user")}
                    </TableCell>
                    <TableCell align="center">
                      {user.queues?.length ? (
                        <div className={classes.queueList}>
                          {user.queues.map(queue => (
                            <Chip
                              key={queue.id}
                              size="small"
                              variant="outlined"
                              label={queue.name}
                              className={classes.queueChip}
                              style={{ borderColor: queue.color }}
                            />
                          ))}
                        </div>
                      ) : (
                        i18n.t("users.table.noQueues")
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {loggedInUser.profile === "admin" && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}

                      {loggedInUser.profile === "admin" && (
                        <IconButton
                          size="small"
                          onClick={e => {
                            setConfirmModalOpen(true);
                            setDeletingUser(user);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            {!loading && profileGroups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  className={classes.emptyCell}
                >
                  {i18n.t("users.empty")}
                </TableCell>
              </TableRow>
            )}
            {loading && <TableRowSkeleton columns={6} />}
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Users;
