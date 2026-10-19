import React, { useCallback, useEffect, useRef, useState } from "react";
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
import moment from "moment";
import InputMask from "react-input-mask";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

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
  chips: { display: "flex", flexWrap: "wrap", gap: theme.spacing(0.75) },
  preview: {
    whiteSpace: "pre-wrap",
    minHeight: 96,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary
  },
  summary: { display: "flex", flexWrap: "wrap", gap: theme.spacing(1) },
  fileRow: { display: "flex", alignItems: "center", gap: theme.spacing(1) },
  mediaPreview: {
    width: 96,
    height: 72,
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover
  },
  hiddenInput: { display: "none" }
}));

const browserTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const dateTimeParts = (value, timezone = browserTimezone) => {
  if (!value) return { date: "", time: "" };
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(new Date(value))
      .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`
    };
  } catch (_error) {
    return {
      date: moment(value).format("YYYY-MM-DD"),
      time: moment(value).format("HH:mm")
    };
  }
};

const initialValues = contactId => {
  const initialDate = moment().add(1, "hour");
  return {
    body: "",
    kind: "ONCE",
    audienceMode: "SELECTED",
    contactIds: contactId ? [Number(contactId)] : [],
    sendDate: initialDate.format("YYYY-MM-DD"),
    sendClock: initialDate.format("HH:mm"),
    sendTime: "09:00",
    timezone: browserTimezone,
    commemorativeDateId: "",
    mediaDeliveryMode: "CAPTION",
    saveMessage: false,
    removeMedia: false
  };
};

const ScheduleModal = ({
  open,
  onClose,
  scheduleId,
  contactId,
  cleanContact,
  reload
}) => {
  const classes = useStyles();
  const messageRef = useRef(null);
  const fileRef = useRef(null);
  const [values, setValues] = useState(initialValues(contactId));
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactPage, setContactPage] = useState(1);
  const [contactsHaveMore, setContactsHaveMore] = useState(false);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [commemorativeDates, setCommemorativeDates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [existingMediaName, setExistingMediaName] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const setValue = (key, value) =>
    setValues(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!file) {
      setFilePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const fetchContacts = useCallback(async (searchParam, pageNumber = 1) => {
    setContactsLoading(true);
    try {
      const { data } = await api.get("/contacts/selection", {
        params: { searchParam, pageNumber }
      });
      setContacts(current =>
        pageNumber === 1
          ? data.contacts
          : [
              ...current,
              ...data.contacts.filter(
                contact => !current.some(item => item.id === contact.id)
              )
            ]
      );
      setContactPage(pageNumber);
      setContactsHaveMore(data.hasMore);
      setContactsTotal(data.count);
    } catch (error) {
      toastError(error);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timeout = setTimeout(() => fetchContacts(contactSearch, 1), 300);
    return () => clearTimeout(timeout);
  }, [contactSearch, fetchContacts, open]);

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setFilePreview("");
    setFile(null);
    Promise.all([
      api.get("/schedules/variables"),
      api.get("/commemorative-dates", { params: { showInactive: false } })
    ])
      .then(([variablesResponse, datesResponse]) => {
        const builtIn = variablesResponse.data.builtIn.map(key => ({ key }));
        setVariables([...builtIn, ...variablesResponse.data.custom]);
        setCommemorativeDates(datesResponse.data);
        if (!scheduleId && variablesResponse.data.timezone) {
          setValue("timezone", variablesResponse.data.timezone);
        }
      })
      .catch(toastError);

    if (!scheduleId) {
      const fresh = initialValues(contactId);
      setValues(fresh);
      if (contactId) {
        api
          .get("/contacts/selection", { params: { ids: contactId } })
          .then(({ data }) => setSelectedContacts(data.contacts))
          .catch(toastError);
      } else {
        setSelectedContacts([]);
      }
      setExistingMediaName("");
      return;
    }

    api
      .get(`/schedules/${scheduleId}`)
      .then(({ data }) => {
        const defaults = initialValues();
        const scheduledParts = dateTimeParts(
          data.sendAt,
          data.timezone || browserTimezone
        );
        const audienceContacts = (data.audienceContacts || [])
          .map(item => item.contact)
          .filter(Boolean);
        setSelectedContacts(audienceContacts);
        setValues({
          ...defaults,
          ...data,
          body: data.body || "",
          kind: data.kind || defaults.kind,
          audienceMode: data.audienceMode || defaults.audienceMode,
          sendTime: data.sendTime || defaults.sendTime,
          timezone: data.timezone || defaults.timezone,
          mediaDeliveryMode:
            data.mediaDeliveryMode || defaults.mediaDeliveryMode,
          saveMessage: Boolean(data.saveMessage),
          contactIds: audienceContacts.map(contact => contact.id),
          sendDate: scheduledParts.date,
          sendClock: scheduledParts.time,
          commemorativeDateId: data.commemorativeDateId || "",
          removeMedia: false
        });
        setExistingMediaName(data.mediaName || "");
      })
      .catch(toastError);
  }, [open, scheduleId, contactId]);

  const payload = () => ({
    ...values,
    contactIds: selectedContacts.map(contact => contact.id),
    contactId: undefined,
    sendAt:
      values.kind === "ONCE"
        ? `${values.sendDate}T${values.sendClock}`
        : undefined,
    sendTime: values.kind === "ONCE" ? undefined : values.sendTime,
    commemorativeDateId:
      values.kind === "COMMEMORATIVE"
        ? Number(values.commemorativeDateId)
        : undefined
  });

  const validate = () => {
    if (values.body.trim().length < 5)
      return i18n.t("scheduleModal.validation.shortMessage");
    if (values.audienceMode === "SELECTED" && !selectedContacts.length) {
      return i18n.t("scheduleModal.validation.selectContact");
    }
    if (values.kind === "ONCE" && !values.sendDate)
      return i18n.t("scheduleModal.validation.dateRequired");
    const time = values.kind === "ONCE" ? values.sendClock : values.sendTime;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || ""))
      return i18n.t("scheduleModal.validation.timeRequired");
    if (values.kind === "COMMEMORATIVE" && !values.commemorativeDateId) {
      return i18n.t("scheduleModal.validation.selectDate");
    }
    return null;
  };

  const handlePreview = async () => {
    const error = validate();
    if (error) return toast.warn(error);
    setPreviewLoading(true);
    try {
      const { data } = await api.post("/schedules/preview", payload());
      setPreview(data);
    } catch (err) {
      toastError(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    const error = validate();
    if (error) return toast.warn(error);
    setLoading(true);
    try {
      const data = payload();
      let requestData = data;
      if (file) {
        requestData = new FormData();
        requestData.append("payload", JSON.stringify(data));
        requestData.append("file", file);
      }
      if (scheduleId) await api.put(`/schedules/${scheduleId}`, requestData);
      else await api.post("/schedules", requestData);
      toast.success(i18n.t("scheduleModal.success"));
      if (reload) reload();
      if (cleanContact) cleanContact();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = key => {
    const input = messageRef.current;
    const token = `{{${key}}}`;
    const start = input?.selectionStart ?? values.body.length;
    const end = input?.selectionEnd ?? start;
    const body = `${values.body.slice(0, start)}${token}${values.body.slice(end)}`;
    setValue("body", body);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle disableTypography>
        <Typography variant="h6">
          {scheduleId
            ? i18n.t("scheduleModal.title.edit")
            : i18n.t("scheduleModal.title.add")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {i18n.t("scheduleModal.subtitle")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("scheduleModal.sections.audience")}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.audienceMode === "ALL"}
                    onChange={event =>
                      setValue(
                        "audienceMode",
                        event.target.checked ? "ALL" : "SELECTED"
                      )
                    }
                    color="primary"
                  />
                }
                label={i18n.t("scheduleModal.form.allContacts")}
              />
              {values.audienceMode === "SELECTED" && (
                <Autocomplete
                  multiple
                  options={contacts}
                  loading={contactsLoading}
                  filterOptions={options => options}
                  ListboxProps={{
                    onScroll: event => {
                      const list = event.currentTarget;
                      if (
                        contactsHaveMore &&
                        !contactsLoading &&
                        list.scrollTop + list.clientHeight >=
                          list.scrollHeight - 16
                      ) {
                        fetchContacts(contactSearch, contactPage + 1);
                      }
                    }
                  }}
                  value={selectedContacts}
                  onInputChange={(_event, value) => setContactSearch(value)}
                  onChange={(_event, value) => setSelectedContacts(value)}
                  getOptionLabel={option => `${option.name} · ${option.number}`}
                  getOptionSelected={(option, value) => option.id === value.id}
                  renderInput={params => (
                    <TextField
                      {...params}
                      variant="outlined"
                      margin="dense"
                      label={i18n.t("scheduleModal.form.contacts")}
                    />
                  )}
                />
              )}
              <Typography variant="caption" color="textSecondary">
                {values.audienceMode === "ALL"
                  ? contactsTotal
                  : selectedContacts.length}{" "}
                {i18n.t("scheduleModal.review.recipients")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("scheduleModal.sections.when")}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <FormControl variant="outlined" margin="dense" fullWidth>
                    <InputLabel id="schedule-kind-label">
                      {i18n.t("scheduleModal.form.kind")}
                    </InputLabel>
                    <Select
                      labelId="schedule-kind-label"
                      value={values.kind}
                      onChange={event => setValue("kind", event.target.value)}
                      label={i18n.t("scheduleModal.form.kind")}
                    >
                      <MenuItem value="ONCE">
                        {i18n.t("scheduleModal.kinds.once")}
                      </MenuItem>
                      <MenuItem value="BIRTHDAY">
                        {i18n.t("scheduleModal.kinds.birthday")}
                      </MenuItem>
                      <MenuItem value="COMMEMORATIVE">
                        {i18n.t("scheduleModal.kinds.commemorative")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {values.kind === "ONCE" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="date"
                      label={i18n.t("scheduleModal.form.sendDate")}
                      value={values.sendDate}
                      onChange={event =>
                        setValue("sendDate", event.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={values.kind === "ONCE" ? 6 : 12}>
                  <InputMask
                    mask="99:99"
                    maskChar={null}
                    value={
                      values.kind === "ONCE"
                        ? values.sendClock
                        : values.sendTime
                    }
                    onChange={event =>
                      setValue(
                        values.kind === "ONCE" ? "sendClock" : "sendTime",
                        event.target.value
                      )
                    }
                  >
                    {inputProps => (
                      <TextField
                        {...inputProps}
                        label={i18n.t("scheduleModal.form.sendTime24h")}
                        placeholder="HH:mm"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          ...inputProps.inputProps,
                          inputMode: "numeric"
                        }}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    )}
                  </InputMask>
                </Grid>
                {values.kind === "COMMEMORATIVE" && (
                  <Grid item xs={12}>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel>
                        {i18n.t("scheduleModal.form.commemorativeDate")}
                      </InputLabel>
                      <Select
                        value={values.commemorativeDateId}
                        onChange={event =>
                          setValue("commemorativeDateId", event.target.value)
                        }
                        label={i18n.t("scheduleModal.form.commemorativeDate")}
                      >
                        {commemorativeDates.map(date => (
                          <MenuItem key={date.id} value={date.id}>
                            {date.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    label={i18n.t("scheduleModal.form.timezone")}
                    value={values.timezone}
                    onChange={event => setValue("timezone", event.target.value)}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("scheduleModal.sections.message")}
              </Typography>
              <TextField
                inputRef={messageRef}
                value={values.body}
                onChange={event => setValue("body", event.target.value)}
                label={i18n.t("scheduleModal.form.body")}
                minRows={6}
                multiline
                variant="outlined"
                fullWidth
              />
              <Box mt={1.5} className={classes.chips}>
                {variables.map(variable => (
                  <Chip
                    key={variable.key}
                    label={`{{${variable.key}}}`}
                    size="small"
                    clickable
                    color="primary"
                    variant="outlined"
                    onClick={() => insertVariable(variable.key)}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("scheduleModal.sections.media")}
              </Typography>
              <input
                ref={fileRef}
                className={classes.hiddenInput}
                type="file"
                accept="image/*,video/*"
                onChange={event => {
                  setFile(event.target.files[0] || null);
                  setValue("removeMedia", false);
                }}
              />
              <Box className={classes.fileRow}>
                {filePreview &&
                  file &&
                  (file.type.startsWith("video/") ? (
                    <video
                      className={classes.mediaPreview}
                      src={filePreview}
                      muted
                    />
                  ) : (
                    <img
                      className={classes.mediaPreview}
                      src={filePreview}
                      alt={file.name}
                    />
                  ))}
                <Button
                  startIcon={<AttachFileIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={() => fileRef.current.click()}
                >
                  {i18n.t("scheduleModal.buttons.attach")}
                </Button>
                <Typography variant="body2" noWrap>
                  {file?.name ||
                    existingMediaName ||
                    i18n.t("scheduleModal.form.noMedia")}
                </Typography>
                {(file || existingMediaName) && (
                  <Button
                    size="small"
                    color="secondary"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => {
                      setFile(null);
                      setExistingMediaName("");
                      setValue("removeMedia", true);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    {i18n.t("scheduleModal.buttons.removeMedia")}
                  </Button>
                )}
              </Box>
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>
                  {i18n.t("scheduleModal.form.mediaMode")}
                </InputLabel>
                <Select
                  value={values.mediaDeliveryMode}
                  onChange={event =>
                    setValue("mediaDeliveryMode", event.target.value)
                  }
                  label={i18n.t("scheduleModal.form.mediaMode")}
                >
                  <MenuItem value="CAPTION">
                    {i18n.t("scheduleModal.mediaModes.caption")}
                  </MenuItem>
                  <MenuItem value="SEPARATE">
                    {i18n.t("scheduleModal.mediaModes.separate")}
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.saveMessage}
                    onChange={event =>
                      setValue("saveMessage", event.target.checked)
                    }
                    color="primary"
                  />
                }
                label={i18n.t("scheduleModal.form.saveMessage")}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" className={classes.section}>
              <Typography className={classes.sectionTitle}>
                {i18n.t("scheduleModal.sections.review")}
              </Typography>
              {preview ? (
                <>
                  <Box className={classes.summary} mb={1.5}>
                    <Chip
                      size="small"
                      label={`${preview.eligibleCount} ${i18n.t(
                        "scheduleModal.review.recipients"
                      )}`}
                    />
                    <Chip
                      size="small"
                      label={`${Math.ceil(preview.estimatedDurationSeconds / 60)} min`}
                    />
                    {preview.excludedCount > 0 && (
                      <Chip
                        size="small"
                        label={`${preview.excludedCount} ${i18n.t(
                          "scheduleModal.review.excluded"
                        )}`}
                      />
                    )}
                    {Object.keys(preview.missingVariables).length > 0 && (
                      <Chip
                        size="small"
                        color="secondary"
                        label={i18n.t("scheduleModal.review.missingData")}
                      />
                    )}
                    {Object.entries(preview.missingVariables).map(
                      ([variable, count]) => (
                        <Chip
                          key={variable}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          label={`{{${variable}}}: ${count}`}
                        />
                      )
                    )}
                  </Box>
                  <div className={classes.preview}>
                    {preview.renderedMessage}
                  </div>
                </>
              ) : (
                <Typography className={classes.sectionHint}>
                  {i18n.t("scheduleModal.review.hint")}
                </Typography>
              )}
              <Box mt={1.5}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    i18n.t("scheduleModal.buttons.preview")
                  )}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {i18n.t("scheduleModal.buttons.cancel")}
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
            i18n.t("scheduleModal.buttons.save")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleModal;
