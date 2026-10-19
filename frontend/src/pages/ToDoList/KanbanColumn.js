import React from "react";
import { fade, makeStyles, Paper, Typography } from "@material-ui/core";
import { CheckCircle } from "@material-ui/icons";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  column: {
    display: "flex",
    flex: "1 0 300px",
    minWidth: 280,
    maxWidth: 420,
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderColor: theme.palette.divider,
    borderRadius: 8,
    backgroundColor: theme.palette.background.default
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minHeight: 52,
    padding: theme.spacing(1.25, 1.5)
  },
  title: { flex: 1, fontSize: 16, fontWeight: 700 },
  doneIcon: { fontSize: 19 },
  count: {
    minWidth: 24,
    padding: theme.spacing(0.25, 0.75),
    borderRadius: 999,
    backgroundColor: fade(theme.palette.common.white, 0.22),
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center"
  },
  body: {
    display: "flex",
    flex: 1,
    minHeight: 120,
    flexDirection: "column",
    gap: theme.spacing(1),
    overflowY: "auto",
    padding: theme.spacing(1.25),
    ...theme.scrollbarStylesSoft
  },
  over: { backgroundColor: theme.palette.action.hover },
  empty: {
    display: "flex",
    flex: 1,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontSize: 13,
    textAlign: "center",
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: 8
  }
}));

const KanbanColumn = ({
  column,
  tasks,
  onEditTask,
  onDeleteTask,
  onOpenTask,
  canAdminister
}) => {
  const classes = useStyles();
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id }
  });
  const color = column.color || column.fallbackColor;
  const contrast = column.getContrastText(color);

  return (
    <Paper className={`${classes.column} sv-quest-column`} variant="outlined">
      <div
        className={`${classes.header} sv-quest-column-header`}
        style={{ backgroundColor: color, color: contrast }}
      >
        {column.isDone && <CheckCircle className={classes.doneIcon} />}
        <Typography className={classes.title} style={{ color: contrast }}>
          {column.title}
        </Typography>
        <span className={`${classes.count} sv-quest-count`}>
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map(task => `task-${task.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`${classes.body} ${isOver ? classes.over : ""}`}
        >
          {tasks.length === 0 && (
            <div className={`${classes.empty} sv-quest-empty`}>
              {i18n.t("todolist.emptyColumn")}
            </div>
          )}
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onOpen={onOpenTask}
              canAdminister={canAdminister}
            />
          ))}
        </div>
      </SortableContext>
    </Paper>
  );
};

export default KanbanColumn;
