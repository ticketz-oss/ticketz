import React from "react";
import {
  IconButton,
  makeStyles,
  Paper,
  Tooltip,
  Typography
} from "@material-ui/core";
import {
  CheckCircleOutline,
  DeleteOutline,
  DragIndicator,
  EditOutlined
} from "@material-ui/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { i18n } from "../../translate/i18n";
import { useDate } from "../../hooks/useDate";
import { deadlineState } from "./taskBoardV2";

const useStyles = makeStyles(theme => ({
  card: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.25),
    borderColor: theme.palette.divider,
    borderRadius: 8,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    transition: theme.transitions.create(["box-shadow", "transform"]),
    "&:hover": { boxShadow: theme.shadows[3] }
  },
  dragging: { opacity: 0.35 },
  handle: {
    flex: "none",
    marginTop: -3,
    marginLeft: -6,
    color: theme.palette.text.secondary,
    cursor: "grab",
    touchAction: "none",
    "&:active": { cursor: "grabbing" }
  },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 14,
    fontWeight: 500,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap"
  },
  completed: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.75),
    color: theme.palette.text.secondary,
    fontSize: theme.isStardew ? 16 : 11
  },
  completedIcon: { fontSize: 14 },
  actions: { display: "flex", flex: "none", marginTop: -5, marginRight: -5 },
  deadline: {
    display: "inline-block",
    marginTop: theme.spacing(0.75),
    padding: theme.spacing(0.25, 0.75),
    borderRadius: 999,
    fontSize: theme.isStardew ? 16 : 11
  },
  ok: {
    backgroundColor: theme.isStardew ? "#e1ecaf" : "#E8F5E9",
    color: theme.isStardew ? "#345e28" : "#2E7D32"
  },
  warning: {
    backgroundColor: theme.isStardew ? "#f5d995" : "#FFF8E1",
    color: theme.isStardew ? "#805335" : "#A05A00"
  },
  overdue: {
    backgroundColor: theme.isStardew ? "#f4c8a5" : "#FFEBEE",
    color: theme.isStardew ? "#a43d26" : "#C62828"
  }
}));

const TaskCard = ({ task, onEdit, onDelete, onOpen, canAdminister }) => {
  const classes = useStyles();
  const { datetimeToClient } = useDate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `task-${task.id}`,
    data: { type: "task", taskId: task.id, columnId: task.columnId }
  });
  const deadline = deadlineState(task);

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      className={`${classes.card} sv-quest-card ${isDragging ? classes.dragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onOpen(task)}
    >
      <Tooltip title={i18n.t("todolist.dragTask")}>
        <IconButton
          size="small"
          className={classes.handle}
          {...attributes}
          {...listeners}
          aria-label={i18n.t("todolist.dragTaskLabel", { title: task.title })}
          onClick={event => event.stopPropagation()}
        >
          <DragIndicator fontSize="small" />
        </IconButton>
      </Tooltip>

      <div className={classes.content}>
        <Typography className={classes.title}>{task.title}</Typography>
        {task.completedAt && (
          <div className={classes.completed}>
            <CheckCircleOutline className={classes.completedIcon} />
            <span>{i18n.t("todolist.details.completedAt")}</span>
            <span>{datetimeToClient(task.completedAt)}</span>
          </div>
        )}
        {task.dueAt && !task.completedAt && (
          <div
            className={`${classes.deadline} sv-quest-deadline ${classes[deadline]}`}
          >
            {i18n.t(`todolist.deadline.${deadline}`)} ·{" "}
            {datetimeToClient(task.dueAt)}
          </div>
        )}
      </div>

      {canAdminister && (
        <div
          className={classes.actions}
          onClick={event => event.stopPropagation()}
        >
          <Tooltip title={i18n.t("todolist.buttons.editTask")}>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={i18n.t("todolist.buttons.deleteTask")}>
            <IconButton size="small" onClick={() => onDelete(task)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </Paper>
  );
};

export default TaskCard;
