import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { getBackendURL } from "../../services/config";

const useStyles = makeStyles(theme => ({
  section: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${theme.palette.divider}`,
    height: "100%",
    boxSizing: "border-box"
  },
  sectionTitle: { fontWeight: 600, marginBottom: theme.spacing(1) },
  sectionHint: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2)
  },
  chips: { display: "flex", flexWrap: "wrap", gap: theme.spacing(0.5) },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexWrap: "wrap"
  },
  mediaPreview: {
    width: 96,
    height: 72,
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover
  },
  hiddenInput: { display: "none" }
}));

const PROFILES = ["admin", "user"];

const initialState = {
  title: "",
  text: "",
  priority: 3,
  status: true,
  isGlobal: false,
  audienceMode: "ALL",
  startsAt: "",
  endsAt: ""
};

/** Converts a stored instant into the local value a datetime-local input wants. */
const toInputValue = value => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Sends an absolute instant so the server never has to guess a timezone. */
const toIsoValue = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const AnnouncementModal = ({ open, onClose, announcementId, reload }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const fileRef = useRef(null);

  const [values, setValues] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [existingMediaName, setExistingMediaName] = useState("");
  const [existingMediaPath, setExistingMediaPath] = useState("");
  const [removeMedia, setRemoveMedia] = useState(false);

  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedQueues, setSelectedQueues] = useState([]);
  const [selectedWhatsapps, setSelectedWhatsapps] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);

  const setValue = (field, value) =>
    setValues(current => ({ ...current, [field]: value }));

  const resetState = useCallback(() => {
    setValues(initialState);
    setFile(null);
    setFilePreview("");
    setExistingMediaName("");
    setExistingMediaPath("");
    setRemoveMedia(false);
    setSelectedUsers([]);
    setSelectedQueues([]);
    setSelectedWhatsapps([]);
    setSelectedProfiles([]);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    const loadOptions = async () => {
      try {
        const [usersData, queuesData, whatsappsData] = await Promise.all([
          api.get("/users/list"),
          api.get("/queue"),
          api.get("/whatsapp")
        ]);
        setUsers(
          usersData.data.map(item => ({ id: item.id, name: item.name }))
        );
        setQueues(
          queuesData.data.map(item => ({
            id: item.id,
            name: item.name,
            color: item.color
          }))
        );
        setWhatsapps(
          whatsappsData.data.map(item => ({ id: item.id, name: item.name }))
        );
      } catch (err) {
        toastError(err);
      }
    };
    loadOptions();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!announcementId) {
      resetState();
      return;
    }
    const loadAnnouncement = async () => {
      try {
        const { data } = await api.get(`/announcements/${announcementId}`);
        setValues({
          title: data.title || "",
          text: data.text || "",
          priority: data.priority ?? 3,
          status: !!data.status,
          isGlobal: !!data.isGlobal,
          audienceMode: data.audienceMode === "SEGMENTED" ? "SEGMENTED" : "ALL",
          startsAt: toInputValue(data.startsAt),
          endsAt: toInputValue(data.endsAt)
        });
        setSelectedUsers(data.users || []);
        setSelectedQueues(data.queues || []);
        setSelectedWhatsapps(data.whatsapps || []);
        setSelectedProfiles(data.profiles || []);
        setExistingMediaName(data.mediaName || "");
        setExistingMediaPath(data.mediaPath || "");
        setFile(null);
        setFilePreview("");
        setRemoveMedia(false);
      } catch (err) {
        toastError(err);
      }
    };
    loadAnnouncement();
  }, [open, announcementId, resetState]);

  useEffect(() => {
    if (!file) {
      setFilePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const segmented = values.audienceMode === "SEGMENTED";

  const audienceCount =
    selectedUsers.length +
    selectedQueues.length +
    selectedWhatsapps.length +
    selectedProfiles.length;

  const validate = () => {
    if (!values.title.trim()) {
      return i18n.t("announcements.validation.titleRequired");
    }
    if (!values.text.trim()) {
      return i18n.t("announcements.validation.textRequired");
    }
    if (segmented && audienceCount === 0) {
      return i18n.t("announcements.validation.audienceRequired");
    }
    if (
      values.startsAt &&
      values.endsAt &&
      new Date(values.endsAt) <= new Date(values.startsAt)
    ) {
      return i18n.t("announcements.validation.invalidWindow");
    }
    return null;
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.warn(error);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: values.title.trim(),
        text: values.text.trim(),
        priority: Number(values.priority),
        status: values.status,
        isGlobal: values.isGlobal,
        audienceMode: values.audienceMode,
        startsAt: toIsoValue(values.startsAt),
        endsAt: toIsoValue(values.endsAt),
        profiles: segmented ? selectedProfiles : [],
        userIds: segmented ? selectedUsers.map(item => item.id) : [],
        queueIds: segmented ? selectedQueues.map(item => item.id) : [],
        whatsappIds: segmented ? selectedWhatsapps.map(item => item.id) : []
      };

      const { data } = announcementId
        ? await api.put(`/announcements/${announcementId}`, payload)
        : await api.post("/announcements", payload);

      const savedId = announcementId || data.id;

      if (removeMedia && !file) {
        await api.delete(`/announcements/${savedId}/media-upload`);
      }

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/announcements/${savedId}/media-upload`, formData);
      }

      toast.success(i18n.t("announcements.toasts.success"));
      if (typeof reload === "function") reload();
      resetState();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const existingMediaUrl =
    existingMediaPath && !file
      ? `${getBackendURL()}/public/${existingMediaPath}`
      : "";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        <Typography variant="h6">
          {announcementId
            ? i18n.t("announcements.dialog.edit")
            : i18n.t("announcements.dialog.add")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {i18n.t("announcements.dialog.subtitle")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("announcements.sections.content")}
              </Typography>
              <TextField
                label={i18n.t("announcements.dialog.form.title")}
                value={values.title}
                onChange={event => setValue("title", event.target.value)}
                variant="outlined"
                margin="dense"
                fullWidth
              />
              <TextField
                label={i18n.t("announcements.dialog.form.text")}
                value={values.text}
                onChange={event => setValue("text", event.target.value)}
                variant="outlined"
                margin="dense"
                fullWidth
                multiline
                rows={8}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("announcements.sections.publication")}
              </Typography>
              <Typography variant="body2" className={classes.sectionHint}>
                {i18n.t("announcements.sections.publicationHint")}
              </Typography>
              <TextField
                label={i18n.t("announcements.dialog.form.startsAt")}
                type="datetime-local"
                value={values.startsAt}
                onChange={event => setValue("startsAt", event.target.value)}
                variant="outlined"
                margin="dense"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={i18n.t("announcements.dialog.form.endsAt")}
                type="datetime-local"
                value={values.endsAt}
                onChange={event => setValue("endsAt", event.target.value)}
                variant="outlined"
                margin="dense"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>
                  {i18n.t("announcements.dialog.form.priority")}
                </InputLabel>
                <Select
                  value={values.priority}
                  onChange={event => setValue("priority", event.target.value)}
                  label={i18n.t("announcements.dialog.form.priority")}
                >
                  <MenuItem value={1}>
                    {i18n.t("announcements.priorities.high")}
                  </MenuItem>
                  <MenuItem value={2}>
                    {i18n.t("announcements.priorities.medium")}
                  </MenuItem>
                  <MenuItem value={3}>
                    {i18n.t("announcements.priorities.low")}
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.status}
                    onChange={event => setValue("status", event.target.checked)}
                    color="primary"
                  />
                }
                label={i18n.t("announcements.dialog.form.active")}
              />
              {user?.super && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.isGlobal}
                      onChange={event =>
                        setValue("isGlobal", event.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={i18n.t("announcements.dialog.form.global")}
                />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("announcements.sections.audience")}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={!segmented}
                    onChange={event =>
                      setValue(
                        "audienceMode",
                        event.target.checked ? "ALL" : "SEGMENTED"
                      )
                    }
                    color="primary"
                  />
                }
                label={i18n.t("announcements.dialog.form.allUsers")}
              />
              {segmented && (
                <>
                  <Typography variant="body2" className={classes.sectionHint}>
                    {i18n.t("announcements.sections.audienceHint")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        multiple
                        size="small"
                        options={users}
                        value={selectedUsers}
                        onChange={(_event, value) => setSelectedUsers(value)}
                        getOptionLabel={option => option.name}
                        getOptionSelected={(option, value) =>
                          option.id === value.id
                        }
                        renderInput={params => (
                          <TextField
                            {...params}
                            variant="outlined"
                            margin="dense"
                            label={i18n.t("announcements.dialog.form.users")}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        multiple
                        size="small"
                        options={queues}
                        value={selectedQueues}
                        onChange={(_event, value) => setSelectedQueues(value)}
                        getOptionLabel={option => option.name}
                        getOptionSelected={(option, value) =>
                          option.id === value.id
                        }
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option.id}
                              size="small"
                              label={option.name}
                              style={{
                                backgroundColor: option.color || undefined,
                                color: option.color ? "#fff" : undefined
                              }}
                            />
                          ))
                        }
                        renderInput={params => (
                          <TextField
                            {...params}
                            variant="outlined"
                            margin="dense"
                            label={i18n.t("announcements.dialog.form.queues")}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        multiple
                        size="small"
                        options={whatsapps}
                        value={selectedWhatsapps}
                        onChange={(_event, value) =>
                          setSelectedWhatsapps(value)
                        }
                        getOptionLabel={option => option.name}
                        getOptionSelected={(option, value) =>
                          option.id === value.id
                        }
                        renderInput={params => (
                          <TextField
                            {...params}
                            variant="outlined"
                            margin="dense"
                            label={i18n.t(
                              "announcements.dialog.form.connections"
                            )}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl variant="outlined" margin="dense" fullWidth>
                        <InputLabel>
                          {i18n.t("announcements.dialog.form.profiles")}
                        </InputLabel>
                        <Select
                          multiple
                          value={selectedProfiles}
                          onChange={event =>
                            setSelectedProfiles(event.target.value)
                          }
                          label={i18n.t("announcements.dialog.form.profiles")}
                          renderValue={selected => (
                            <div className={classes.chips}>
                              {selected.map(item => (
                                <Chip
                                  key={item}
                                  size="small"
                                  label={i18n.t(
                                    `announcements.profiles.${item}`
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        >
                          {PROFILES.map(item => (
                            <MenuItem key={item} value={item}>
                              {i18n.t(`announcements.profiles.${item}`)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="textSecondary">
                    {i18n.t("announcements.dialog.form.audienceSummary", {
                      count: audienceCount
                    })}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("announcements.sections.media")}
              </Typography>
              <input
                ref={fileRef}
                className={classes.hiddenInput}
                type="file"
                accept="image/*"
                onChange={event => {
                  setFile(event.target.files[0] || null);
                  setRemoveMedia(false);
                }}
              />
              <Box className={classes.fileRow}>
                {(filePreview || existingMediaUrl) && (
                  <img
                    className={classes.mediaPreview}
                    src={filePreview || existingMediaUrl}
                    alt={file?.name || existingMediaName}
                  />
                )}
                <Button
                  startIcon={<AttachFileIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={() => fileRef.current.click()}
                >
                  {i18n.t("announcements.dialog.buttons.attach")}
                </Button>
                <Typography variant="body2" noWrap>
                  {file?.name ||
                    existingMediaName ||
                    i18n.t("announcements.dialog.form.noMedia")}
                </Typography>
                {(file || existingMediaName) && (
                  <Button
                    size="small"
                    color="secondary"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => {
                      setFile(null);
                      setExistingMediaName("");
                      setExistingMediaPath("");
                      setRemoveMedia(true);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    {i18n.t("announcements.dialog.buttons.removeMedia")}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {i18n.t("announcements.dialog.buttons.cancel")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={22} />
          ) : (
            i18n.t("announcements.dialog.buttons.save")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnouncementModal;
