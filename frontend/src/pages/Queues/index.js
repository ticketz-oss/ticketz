import StardewEmblem from "../../components/StardewEmblem";
import { Link } from "react-router-dom";
import { Workflow } from "lucide-react";
import React, { useContext, useEffect, useReducer, useState } from "react";

import {
  Button,
  CircularProgress,
  IconButton,
  makeStyles,
  Paper,
  Tooltip,
  Typography
} from "@material-ui/core";
import { DeleteOutline, DragIndicator, Edit } from "@material-ui/icons";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { i18nToast } from "../../helpers/i18nToast";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import QueueModal from "../../components/QueueModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import useSortableList from "../../hooks/useSortableList";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  hint: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontSize: theme.isStardew ? 18 : 12.5
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    "& .draggable-source--is-dragging": { opacity: 0.22 },
    "& .draggable-mirror": {
      opacity: 0.96,
      boxShadow: theme.isStardew
        ? "4px 6px 0 #5b341f80"
        : "0 18px 38px rgba(17,27,33,.2)"
    }
  },
  card: {
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    padding: theme.spacing(1),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: "transform 160ms cubic-bezier(.23,1,.32,1)"
  },
  stripe: {
    flex: "none",
    alignSelf: "stretch",
    width: 6,
    marginRight: theme.spacing(1.5),
    borderRadius: 999
  },
  handle: {
    display: "flex",
    alignItems: "center",
    flex: "none",
    padding: 4,
    marginRight: 4,
    border: "none",
    borderRadius: 8,
    color: theme.palette.text.secondary,
    background: "transparent",
    cursor: "grab",
    "&:active": { cursor: "grabbing" }
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: theme.isStardew ? 21 : 14, fontWeight: 600 },
  greeting: {
    fontSize: theme.isStardew ? 18 : 12,
    color: theme.palette.text.secondary
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    flex: "none",
    marginRight: theme.spacing(1),
    padding: "3px 10px",
    borderRadius: 999,
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary,
    fontSize: 11,
    fontWeight: 600
  },
  badgeIcon: { fontSize: 13, marginRight: 4 },
  empty: {
    padding: theme.spacing(6),
    textAlign: "center",
    color: theme.palette.text.secondary
  },
  loading: { display: "flex", justifyContent: "center", padding: 36 }
}));

const reducer = (state, action) => {
  if (action.type === "SET_QUEUES") {
    return action.payload;
  }

  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const queueIndex = state.findIndex(u => u.id === queue.id);

    if (queueIndex === -1) {
      return [...state, queue];
    }

    return state.map(item => (item.id === queue.id ? queue : item));
  }

  if (action.type === "DELETE_QUEUE") {
    return state.filter(queue => queue.id !== action.payload);
  }

  return state;
};

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const Queues = () => {
  const classes = useStyles();

  const [queues, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const socketManager = useContext(SocketContext);

  const fetchQueues = async () => {
    const { data } = await api.get("/queue");
    dispatch({ type: "SET_QUEUES", payload: data });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await fetchQueues();
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onQueue = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
      }

      if (data.action === "reorder") {
        dispatch({ type: "SET_QUEUES", payload: data.queues });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };

    socket.on(`company-${companyId}-queue`, onQueue);

    return () => {
      // Antes chamava socket.disconnect(), derrubando o socket compartilhado
      // da aplicação inteira ao sair desta tela.
      socket.off(`company-${companyId}-queue`, onQueue);
    };
  }, [socketManager]);

  const handleOpenQueueModal = () => {
    setQueueModalOpen(true);
    setSelectedQueue(null);
  };

  const handleCloseQueueModal = () => {
    setQueueModalOpen(false);
    setSelectedQueue(null);
    fetchQueues().catch(toastError);
  };

  const handleEditQueue = queue => {
    setSelectedQueue(queue);
    setQueueModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async queueId => {
    try {
      await api.delete(`/queue/${queueId}`);
      i18nToast.success("queues.toasts.deleted");
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleMove = async (from, to) => {
    const previous = queues;
    const next = move(queues, from, to);

    setAnnouncement(
      i18n.t("queues.moved", {
        name: queues[from]?.name || "",
        position: to + 1,
        total: queues.length
      })
    );
    dispatch({ type: "SET_QUEUES", payload: next });

    try {
      await api.put("/queue/reorder", {
        items: next.map((queue, index) => ({ id: queue.id, order: index }))
      });
    } catch (err) {
      dispatch({ type: "SET_QUEUES", payload: previous });
      toastError(err);
    }
  };

  const listRef = useSortableList(handleMove, !loading && queues.length > 1);

  const renderCard = (queue, index) => (
    <div
      key={queue.id}
      data-sortable-item
      className={`${classes.card} sv-queue-card`}
    >
      <button
        type="button"
        data-drag-handle
        className={`${classes.handle} sv-queue-handle`}
        aria-label={i18n.t("queues.moveHandle", { name: queue.name })}
        onKeyDown={event => {
          if (event.key === "ArrowUp" && index > 0) {
            event.preventDefault();
            handleMove(index, index - 1);
          }
          if (event.key === "ArrowDown" && index < queues.length - 1) {
            event.preventDefault();
            handleMove(index, index + 1);
          }
        }}
      >
        <DragIndicator fontSize="small" />
      </button>

      <span
        className={`${classes.stripe} sv-queue-stripe`}
        style={{ backgroundColor: queue.color }}
      />

      <div className={classes.info}>
        <Typography component="div" className={classes.name} noWrap>
          {queue.name}
        </Typography>
        <Typography component="div" className={classes.greeting} noWrap>
          {queue.greetingMessage || i18n.t("queues.noGreeting")}
        </Typography>
      </div>

      <Tooltip title={i18n.t("queues.optionsCountHint")}>
        <span className={`${classes.badge} sv-queue-count`}>
          <ChatBubbleOutlineIcon className={classes.badgeIcon} />
          {queue.optionsCount || 0}
        </span>
      </Tooltip>

      <Button
        component={Link}
        to={`/fluxos/${queue.id}`}
        startIcon={<Workflow size={16} />}
        color="primary"
      >
        {i18n.t("fluxos.abrirEditor")}
      </Button>
      <IconButton size="small" onClick={() => handleEditQueue(queue)}>
        <Edit />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => {
          setSelectedQueue(queue);
          setConfirmModalOpen(true);
        }}
      >
        <DeleteOutline />
      </IconButton>
    </div>
  );

  return (
    <MainContainer className="sv-operations sv-screen-queues">
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${
            selectedQueue.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("queues.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <QueueModal
        open={queueModalOpen}
        onClose={handleCloseQueueModal}
        queueId={selectedQueue?.id}
      />
      <MainHeader>
        <StardewEmblem item="chest" />
        <Title>{i18n.t("queues.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenQueueModal}
          >
            {i18n.t("queues.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <div className={classes.hint}>{i18n.t("queues.dragHint")}</div>

        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={28} />
          </div>
        )}

        {!loading && queues.length === 0 && (
          <div className={classes.empty}>{i18n.t("queues.empty")}</div>
        )}

        <div className={classes.list} ref={listRef}>
          {queues.map(renderCard)}
        </div>

        <div style={{ position: "absolute", left: -9999 }} aria-live="polite">
          {announcement}
        </div>
      </Paper>
    </MainContainer>
  );
};

export default Queues;
