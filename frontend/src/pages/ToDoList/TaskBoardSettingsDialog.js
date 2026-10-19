import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Radio,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@material-ui/core";
import {
  Add,
  ArrowBack,
  ArrowForward,
  Colorize,
  DeleteOutline,
  EditOutlined
} from "@material-ui/icons";
import ColorPicker from "../../components/ColorPicker";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { i18nToast } from "../../helpers/i18nToast";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  intro: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  list: { minWidth: 480, [theme.breakpoints.down("xs")]: { minWidth: 0 } },
  item: {
    paddingRight: 176,
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  swatch: {
    display: "inline-block",
    width: 14,
    height: 14,
    marginRight: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.isStardew ? 0 : "50%",
    verticalAlign: -2
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minWidth: 360,
    [theme.breakpoints.down("xs")]: { minWidth: 0 }
  },
  colorButton: { flex: "none" },
  brandColor: { marginTop: theme.spacing(1) }
}));

const TaskBoardSettingsDialog = ({ open, onClose, columns, onChanged }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [deleteColumn, setDeleteColumn] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(editingColumn?.title || "");
    setColor(editingColumn?.color || null);
  }, [editingColumn]);

  const closeColumnDialog = () => {
    setColumnDialogOpen(false);
    setEditingColumn(null);
    setTitle("");
    setColor(null);
  };

  const saveColumn = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editingColumn) {
        await api.put(`/task-board/columns/${editingColumn.id}`, {
          title: title.trim(),
          color
        });
      } else {
        await api.post("/task-board/columns", { title: title.trim(), color });
      }
      closeColumnDialog();
      await onChanged();
      i18nToast.success("todolist.toasts.columnSaved");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const markDone = async column => {
    if (column.isDone) return;
    try {
      await api.put(`/task-board/columns/${column.id}`, { isDone: true });
      await onChanged();
      i18nToast.success("todolist.toasts.doneColumnChanged");
    } catch (err) {
      toastError(err);
    }
  };

  const moveColumn = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    const [column] = next.splice(index, 1);
    next.splice(target, 0, column);
    try {
      await api.put("/task-board/columns/reorder", {
        ids: next.map(item => item.id)
      });
      await onChanged();
    } catch (err) {
      toastError(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteColumn) return;
    try {
      await api.delete(`/task-board/columns/${deleteColumn.id}`);
      setDeleteColumn(null);
      await onChanged();
      i18nToast.success("todolist.toasts.columnDeleted");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{i18n.t("todolist.settings.title")}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" className={classes.intro}>
            {i18n.t("todolist.settings.description")}
          </Typography>
          <List className={classes.list}>
            {columns.map((column, index) => (
              <ListItem key={column.id} className={classes.item}>
                <Radio
                  checked={column.isDone}
                  onChange={() => markDone(column)}
                  color="primary"
                  inputProps={{
                    "aria-label": i18n.t("todolist.settings.markDone", {
                      title: column.title
                    })
                  }}
                />
                <ListItemText
                  primary={
                    <>
                      <span
                        className={classes.swatch}
                        style={{
                          backgroundColor: column.color || column.fallbackColor
                        }}
                      />
                      {column.title}
                    </>
                  }
                  secondary={
                    column.isDone
                      ? i18n.t("todolist.settings.doneColumn")
                      : i18n.t("todolist.settings.regularColumn")
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={i18n.t("todolist.settings.moveLeft")}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => moveColumn(index, -1)}
                      >
                        <ArrowBack fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={i18n.t("todolist.settings.moveRight")}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === columns.length - 1}
                        onClick={() => moveColumn(index, 1)}
                      >
                        <ArrowForward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={i18n.t("common.edit")}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingColumn(column);
                        setColumnDialogOpen(true);
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={i18n.t("common.delete")}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={column.isDone}
                        onClick={() => setDeleteColumn(column)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            color="primary"
            startIcon={<Add />}
            onClick={() => {
              setEditingColumn(null);
              setColumnDialogOpen(true);
            }}
          >
            {i18n.t("todolist.buttons.addColumn")}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{i18n.t("common.close")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={columnDialogOpen}
        onClose={closeColumnDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingColumn
            ? i18n.t("todolist.settings.editColumn")
            : i18n.t("todolist.settings.newColumn")}
        </DialogTitle>
        <DialogContent dividers>
          <div className={classes.formRow}>
            <TextField
              autoFocus
              fullWidth
              variant="outlined"
              label={i18n.t("todolist.form.columnName")}
              value={title}
              inputProps={{ maxLength: 120 }}
              onChange={event => setTitle(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") saveColumn();
              }}
            />
            <Tooltip title={i18n.t("todolist.settings.chooseColor")}>
              <IconButton
                className={classes.colorButton}
                onClick={() => setColorPickerOpen(true)}
                style={{ color: color || undefined }}
              >
                <Colorize />
              </IconButton>
            </Tooltip>
          </div>
          <Button
            size="small"
            className={classes.brandColor}
            onClick={() => setColor(null)}
          >
            {i18n.t("todolist.settings.useBrandColor")}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeColumnDialog}>{i18n.t("common.cancel")}</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={saving || !title.trim()}
            onClick={saveColumn}
          >
            {i18n.t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <ColorPicker
        open={colorPickerOpen}
        currentColor={color || theme.palette.primary.main}
        handleClose={() => setColorPickerOpen(false)}
        onChange={setColor}
      />

      <ConfirmationModal
        open={!!deleteColumn}
        onClose={() => setDeleteColumn(null)}
        onConfirm={confirmDelete}
        title={i18n.t("todolist.confirm.deleteColumnTitle")}
      >
        {i18n.t("todolist.confirm.deleteColumn", {
          title: deleteColumn?.title || ""
        })}
      </ConfirmationModal>
    </>
  );
};

export default TaskBoardSettingsDialog;
