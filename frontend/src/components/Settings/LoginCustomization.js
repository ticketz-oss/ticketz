import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import BrandPanel from "../LoginExperience/BrandPanel";
import { i18n } from "../../translate/i18n";
import { i18nToast } from "../../helpers/i18nToast";
import toastError from "../../errors/toastError";

const fields = ["loginHeadline", "loginDescription", "loginTemplate"];
const readDraft = settings => ({
  loginHeadline: settings.loginHeadline || "",
  loginDescription: settings.loginDescription || "",
  loginTemplate: settings.loginTemplate === "minimal" ? "minimal" : "aurora"
});

const useStyles = makeStyles(theme => ({
  section: {
    paddingBottom: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  heading: { fontWeight: 700, marginBottom: theme.spacing(1) },
  fields: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
  preview: {
    overflow: "hidden",
    borderRadius: theme.isStardew ? 0 : 20,
    minWidth: 0
  },
  caption: { marginTop: theme.spacing(1), textAlign: "center" },
  button: { alignSelf: "flex-start" }
}));

export default function LoginCustomization({ settings = {}, onSave }) {
  const classes = useStyles();
  const [draft, setDraft] = useState(() => readDraft(settings));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editing = useRef(false);
  const inFlight = useRef(false);
  const incoming = JSON.stringify(readDraft(settings));

  useEffect(() => {
    // A settings refresh (including socket events) must not discard an unsaved draft.
    if (!editing.current) setDraft(JSON.parse(incoming));
  }, [incoming]);

  const change = (key, value) => {
    editing.current = true;
    setDirty(true);
    setDraft(current => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      // Use the existing tenant-scoped settings API. Retry safely after partial failure.
      for (const key of fields) await onSave(key, draft[key].trim());
      editing.current = false;
      setDirty(false);
      i18nToast.success("settings.success");
    } catch (error) {
      toastError(error);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <section
      className={classes.section}
      aria-labelledby="login-customization-title"
    >
      <Typography
        id="login-customization-title"
        variant="h6"
        className={classes.heading}
      >
        {i18n.t("loginExperience.customizationTitle")}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {i18n.t("loginExperience.customizationDescription")}
      </Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={6} className={classes.fields}>
          <TextField
            id="login-template-field"
            select
            variant="outlined"
            fullWidth
            label={i18n.t("loginExperience.templateLabel")}
            value={draft.loginTemplate}
            disabled={saving}
            onChange={event => change("loginTemplate", event.target.value)}
          >
            <MenuItem value="aurora">
              {i18n.t("loginExperience.templateAurora")}
            </MenuItem>
            <MenuItem value="minimal">
              {i18n.t("loginExperience.templateMinimal")}
            </MenuItem>
          </TextField>
          <TextField
            id="login-headline-field"
            variant="outlined"
            fullWidth
            label={i18n.t("loginExperience.headlineLabel")}
            placeholder={i18n.t("loginExperience.headline")}
            value={draft.loginHeadline}
            inputProps={{ maxLength: 120 }}
            disabled={saving}
            helperText={`${draft.loginHeadline.length}/120 · ${i18n.t("loginExperience.defaultWhenEmpty")}`}
            onChange={event => change("loginHeadline", event.target.value)}
          />
          <TextField
            id="login-description-field"
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            label={i18n.t("loginExperience.descriptionLabel")}
            placeholder={i18n.t("loginExperience.description")}
            value={draft.loginDescription}
            inputProps={{ maxLength: 240 }}
            disabled={saving}
            helperText={`${draft.loginDescription.length}/240 · ${i18n.t("loginExperience.defaultWhenEmpty")}`}
            onChange={event => change("loginDescription", event.target.value)}
          />
          <Button
            type="button"
            variant="contained"
            color="primary"
            disableElevation
            className={classes.button}
            disabled={saving || !dirty}
            onClick={save}
          >
            {i18n.t(
              saving
                ? "loginExperience.saving"
                : "loginExperience.saveCustomization"
            )}
          </Button>
          <Typography variant="caption" color="textSecondary">
            {i18n.t("loginExperience.brandingHint")}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <div className={`${classes.preview} sd-login-preview-frame`}>
            <BrandPanel settings={{ ...settings, ...draft }} preview />
          </div>
          <Typography
            variant="caption"
            component="p"
            color="textSecondary"
            className={classes.caption}
          >
            {i18n.t("loginExperience.livePreview")}
          </Typography>
        </Grid>
      </Grid>
    </section>
  );
}
