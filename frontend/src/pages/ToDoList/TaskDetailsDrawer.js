import React, { useEffect, useState } from "react";
import {
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography
} from "@material-ui/core";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { useDate } from "../../hooks/useDate";

const TaskDetailsDrawer = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const { datetimeToClient } = useDate();

  useEffect(() => {
    if (!taskId) return;
    setTask(null);
    api
      .get(`/task-board/tasks/${taskId}`)
      .then(response => setTask(response.data))
      .catch(toastError);
  }, [taskId]);

  const targetName =
    task?.assignedUser?.name ||
    task?.assignedQueue?.name ||
    i18n.t("todolist.targets.global");

  return (
    <Drawer
      anchor="right"
      open={!!taskId}
      onClose={onClose}
      PaperProps={{ className: "sv-quest-details" }}
    >
      <div style={{ width: "min(460px, 92vw)", padding: 24 }}>
        {!task ? (
          <CircularProgress size={28} />
        ) : (
          <>
            <Typography variant="h5">{task.title}</Typography>
            <Typography
              color="textSecondary"
              style={{ whiteSpace: "pre-wrap", marginTop: 12 }}
            >
              {task.description || i18n.t("todolist.details.noDescription")}
            </Typography>
            <Divider style={{ margin: "20px 0" }} />
            <Typography>
              <strong>{i18n.t("todolist.details.state")}:</strong>{" "}
              {task.column?.title || "-"}
            </Typography>
            <Typography>
              <strong>{i18n.t("todolist.details.target")}:</strong> {targetName}
            </Typography>
            <Typography>
              <strong>{i18n.t("todolist.details.createdBy")}:</strong>{" "}
              {task.createdBy?.name || "-"}
            </Typography>
            <Typography>
              <strong>{i18n.t("todolist.details.createdAt")}:</strong>{" "}
              {datetimeToClient(task.createdAt)}
            </Typography>
            {task.dueAt && (
              <Typography>
                <strong>{i18n.t("todolist.details.dueAt")}:</strong>{" "}
                {datetimeToClient(task.dueAt)}
              </Typography>
            )}
            {task.completedAt && (
              <Typography>
                <strong>{i18n.t("todolist.details.completedAt")}:</strong>{" "}
                {datetimeToClient(task.completedAt)} ·{" "}
                {task.completedBy?.name || "-"}
              </Typography>
            )}
            <Typography variant="h6" style={{ marginTop: 24 }}>
              {i18n.t("todolist.details.history")}
            </Typography>
            <List dense>
              {(task.events || []).map(event => (
                <ListItem key={event.id} divider>
                  <ListItemText
                    primary={i18n.t(`todolist.events.${event.eventType}`)}
                    secondary={`${event.user?.name || "-"} · ${datetimeToClient(
                      event.createdAt
                    )}${
                      event.fromColumn && event.toColumn
                        ? ` · ${event.fromColumn.title} → ${event.toColumn.title}`
                        : ""
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </div>
    </Drawer>
  );
};

export default TaskDetailsDrawer;
