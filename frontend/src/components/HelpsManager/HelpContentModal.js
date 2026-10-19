import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  makeStyles
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import RichTextEditor from "../RichTextEditor";
import parseYoutubeId from "../../helpers/parseYoutubeId";
import { bucketLabel } from "./scope";

const useStyles = makeStyles(theme => ({
  tabs: {
    marginBottom: theme.spacing(2)
  },
  row: {
    display: "flex",
    gap: theme.spacing(2)
  },
  preview: {
    width: 120,
    aspectRatio: "16 / 9",
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    alignSelf: "center"
  }
}));

const EMPTY = {
  groupId: "",
  title: "",
  description: "",
  type: "video",
  video: "",
  content: "",
  duration: "",
  link: "",
  adminOnly: false,
  isActive: true
};

const HelpContentModal = ({
  open,
  content,
  groups,
  defaultGroupId,
  onSave,
  onClose
}) => {
  const classes = useStyles();
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) {
      setValues({ ...EMPTY, ...content });
      return;
    }

    setValues({ ...EMPTY, groupId: defaultGroupId || "" });
  }, [content, defaultGroupId, open]);

  const setField = (field, value) =>
    setValues(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  const isArticle = values.type === "article";
  const selectedGroup = groups.find(
    group => String(group.id) === String(values.groupId)
  );

  // Aceita o link inteiro do YouTube (e o que se copia da barra de enderecos) e
  // resolve para o id — a previa aparecendo confirma que foi entendido.
  const videoId = parseYoutubeId(values.video);
  const videoInvalid = !isArticle && !!values.video && !videoId;

  const canSave =
    values.title.trim() &&
    values.groupId &&
    (isArticle
      ? !!values.content && !!values.content.replace(/<[^>]*>/g, "").trim()
      : !!(videoId || values.link));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {values.id
          ? i18n.t("helps.contentModal.editTitle")
          : i18n.t("helps.contentModal.addTitle")}
      </DialogTitle>
      <DialogContent>
        <Tabs
          className={classes.tabs}
          value={values.type}
          onChange={(event, value) => setField("type", value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="video" label={i18n.t("helps.contentType.video")} />
          <Tab value="article" label={i18n.t("helps.contentType.article")} />
        </Tabs>

        <FormControl variant="outlined" margin="dense" fullWidth>
          <InputLabel id="help-content-group">
            {i18n.t("helps.contentModal.group")}
          </InputLabel>
          <Select
            labelId="help-content-group"
            label={i18n.t("helps.contentModal.group")}
            value={values.groupId}
            onChange={event => setField("groupId", event.target.value)}
          >
            {groups.map(group => (
              <MenuItem key={group.id} value={group.id}>
                {group.title} ({bucketLabel(group)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          variant="outlined"
          margin="dense"
          label={i18n.t("helps.contentModal.title")}
          value={values.title}
          onChange={event => setField("title", event.target.value)}
        />

        <TextField
          fullWidth
          variant="outlined"
          margin="dense"
          label={i18n.t("helps.contentModal.description")}
          value={values.description || ""}
          onChange={event => setField("description", event.target.value)}
        />

        {isArticle ? (
          <Box mt={2}>
            <RichTextEditor
              value={values.content}
              onChange={value => setField("content", value)}
              placeholder={i18n.t("helps.contentModal.contentPlaceholder")}
            />
          </Box>
        ) : (
          <Box className={classes.row}>
            <TextField
              fullWidth
              variant="outlined"
              margin="dense"
              label={i18n.t("helps.contentModal.video")}
              error={videoInvalid}
              helperText={i18n.t(
                videoInvalid
                  ? "helps.contentModal.videoInvalid"
                  : "helps.contentModal.videoHelper"
              )}
              value={values.video || ""}
              onChange={event => setField("video", event.target.value)}
            />
            <TextField
              variant="outlined"
              margin="dense"
              label={i18n.t("helps.contentModal.duration")}
              value={values.duration || ""}
              onChange={event => setField("duration", event.target.value)}
            />
            {videoId ? (
              <img
                className={classes.preview}
                src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                alt={i18n.t("helps.contentModal.videoPreview")}
              />
            ) : null}
          </Box>
        )}

        {!isArticle ? (
          <TextField
            fullWidth
            variant="outlined"
            margin="dense"
            label={i18n.t("helps.contentModal.link")}
            helperText={i18n.t("helps.contentModal.linkHelper")}
            value={values.link || ""}
            onChange={event => setField("link", event.target.value)}
          />
        ) : null}

        {selectedGroup?.audience === "company" ? (
          <FormControlLabel
            control={
              <Switch
                checked={!!values.adminOnly}
                onChange={event => setField("adminOnly", event.target.checked)}
                color="primary"
              />
            }
            label={i18n.t("helps.contentModal.adminOnly")}
          />
        ) : null}

        <FormControlLabel
          control={
            <Switch
              checked={!!values.isActive}
              onChange={event => setField("isActive", event.target.checked)}
              color="primary"
            />
          }
          label={i18n.t("helps.active")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={saving}>
          {i18n.t("helps.buttons.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={saving || !canSave}
        >
          {i18n.t("helps.buttons.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpContentModal;
