import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from "@material-ui/core";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { i18nToast } from "../../helpers/i18nToast";
import { AuthContext } from "../../context/Auth/AuthContext";
import { toTaskInputDate, toTaskIsoDate } from "./taskBoardV2";

const TaskDialog = ({ open, task, onClose, onSaved }) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const canAssignTasks = user?.profile === "admin";

  useEffect(() => {
    if (!open || !canAssignTasks) return;
    Promise.all([api.get("/users/list"), api.get("/queue")])
      .then(([userResponse, queueResponse]) => {
        setUsers(userResponse.data || []);
        setQueues(queueResponse.data || []);
      })
      .catch(toastError);
  }, [open, canAssignTasks]);

  const initialValues = useMemo(
    () => ({
      title: task?.title || "",
      description: task?.description || "",
      targetType: task?.targetType || (canAssignTasks ? "GLOBAL" : "USER"),
      assignedUserId: task?.assignedUserId || (canAssignTasks ? "" : user?.id),
      assignedQueueId: task?.assignedQueueId || "",
      dueAt: toTaskInputDate(task?.dueAt),
      version: task?.version
    }),
    [task, canAssignTasks, user?.id]
  );

  const schema = Yup.object().shape({
    title: Yup.string().trim().required().max(255),
    description: Yup.string().max(10000),
    targetType: Yup.string().oneOf(["GLOBAL", "USER", "QUEUE"]).required(),
    assignedUserId: Yup.number().when("targetType", {
      is: "USER",
      then: schema => schema.positive().integer().required()
    }),
    assignedQueueId: Yup.number().when("targetType", {
      is: "QUEUE",
      then: schema => schema.positive().integer().required()
    })
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {i18n.t(task ? "todolist.editTaskTitle" : "todolist.newTaskTitle")}
      </DialogTitle>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, actions) => {
          const targetType = canAssignTasks ? values.targetType : "USER";
          const payload = {
            ...values,
            targetType,
            title: values.title.trim(),
            description: values.description.trim(),
            assignedUserId:
              targetType === "USER"
                ? Number(canAssignTasks ? values.assignedUserId : user?.id)
                : null,
            assignedQueueId:
              targetType === "QUEUE" ? Number(values.assignedQueueId) : null,
            dueAt: toTaskIsoDate(values.dueAt)
          };
          try {
            if (task) await api.put(`/task-board/tasks/${task.id}`, payload);
            else await api.post("/task-board/tasks", payload);
            i18nToast.success(
              task ? "todolist.toasts.taskSaved" : "todolist.toasts.taskCreated"
            );
            onSaved();
            onClose();
          } catch (error) {
            toastError(error);
          } finally {
            actions.setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, isSubmitting }) => (
          <Form>
            <DialogContent dividers style={{ display: "grid", gap: 16 }}>
              <TextField
                autoFocus
                name="title"
                label={i18n.t("todolist.form.name")}
                value={values.title}
                onChange={handleChange}
                error={touched.title && !!errors.title}
                helperText={touched.title && errors.title}
                variant="outlined"
                fullWidth
              />
              <TextField
                name="description"
                label={i18n.t("todolist.form.description")}
                value={values.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={4}
                fullWidth
              />
              {canAssignTasks && (
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>{i18n.t("todolist.form.targetType")}</InputLabel>
                  <Select
                    name="targetType"
                    value={values.targetType}
                    onChange={handleChange}
                    label={i18n.t("todolist.form.targetType")}
                  >
                    <MenuItem value="GLOBAL">
                      {i18n.t("todolist.targets.global")}
                    </MenuItem>
                    <MenuItem value="USER">
                      {i18n.t("todolist.targets.user")}
                    </MenuItem>
                    <MenuItem value="QUEUE">
                      {i18n.t("todolist.targets.queue")}
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
              {canAssignTasks && values.targetType === "USER" && (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={touched.assignedUserId && !!errors.assignedUserId}
                >
                  <InputLabel>{i18n.t("todolist.form.assignee")}</InputLabel>
                  <Select
                    name="assignedUserId"
                    value={values.assignedUserId}
                    onChange={handleChange}
                    label={i18n.t("todolist.form.assignee")}
                  >
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {canAssignTasks && values.targetType === "QUEUE" && (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={touched.assignedQueueId && !!errors.assignedQueueId}
                >
                  <InputLabel>{i18n.t("todolist.form.queue")}</InputLabel>
                  <Select
                    name="assignedQueueId"
                    value={values.assignedQueueId}
                    onChange={handleChange}
                    label={i18n.t("todolist.form.queue")}
                  >
                    {queues.map(queue => (
                      <MenuItem key={queue.id} value={queue.id}>
                        {queue.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <TextField
                name="dueAt"
                type="datetime-local"
                label={i18n.t("todolist.form.dueAt")}
                value={values.dueAt}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>{i18n.t("common.cancel")}</Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {i18n.t("common.save")}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default TaskDialog;
