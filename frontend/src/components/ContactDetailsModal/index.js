import React, { useEffect, useState } from "react";

import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";
import ClickableContactAvatar from "../ClickableContactAvatar";

const languageOptions = {};

Object.keys(messages).forEach(key => {
  languageOptions[key] =
    messages[key].translations.mainDrawer.appBar.i18n.language;
});

const useStyles = makeStyles(theme => ({
  dialogContent: {
    display: "grid",
    gap: theme.spacing(2.5)
  },
  actions: {
    padding: theme.spacing(1.5, 3, 2)
  },
  heroCard: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius * 2,
    background: `linear-gradient(135deg, ${theme.palette.action.hover} 0%, ${theme.palette.background.paper} 100%)`,
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-start"
    }
  },
  avatarFrame: {
    flexShrink: 0,
    padding: theme.spacing(0.75),
    borderRadius: "50%",
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1]
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
    gap: theme.spacing(1)
  },
  avatar: {
    width: 88,
    height: 88
  },
  overline: {
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: theme.palette.text.secondary
  },
  title: {
    fontWeight: 600,
    lineHeight: 1.2
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1.25),
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr"
    }
  },
  infoCard: {
    padding: theme.spacing(1.25, 1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    boxShadow: `inset 0 0 0 1px ${theme.palette.divider}`
  },
  infoLabel: {
    display: "block",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5)
  },
  muted: {
    color: theme.palette.text.secondary
  },
  metadataChip: {
    backgroundColor: theme.palette.background.paper
  },
  metadataRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(0.5)
  },
  sectionCard: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 1.5
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.25)
  },
  sectionCount: {
    padding: theme.spacing(0.25, 0.75),
    borderRadius: 999,
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary,
    fontWeight: 600
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(0.5)
  },
  extraInfoList: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    marginTop: theme.spacing(0.5)
  },
  extraInfoItem: {
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover
  },
  emptyState: {
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover,
    border: `1px dashed ${theme.palette.divider}`
  },
  statusCard: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 1.5,
    display: "grid",
    gap: theme.spacing(1)
  },
  loadingState: {
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
}));

const ContactDetailsModal = ({ open, onClose, contactId, onEdit }) => {
  const classes = useStyles();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasContact = Boolean(contact);
  const languageLabel = contact?.language
    ? languageOptions[contact.language] || contact.language
    : "-";
  const chatbotStatus = contact?.disableBot
    ? i18n.t("common.disabled")
    : i18n.t("common.enabled");

  useEffect(() => {
    let isMounted = true;

    const fetchContact = async () => {
      if (!open || !contactId) {
        if (isMounted) {
          setContact(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data } = await api.get(`/contacts/${contactId}`);
        if (isMounted) {
          setContact(data);
        }
      } catch (error) {
        if (isMounted) {
          setContact(null);
        }
        toastError(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchContact();

    return () => {
      isMounted = false;
    };
  }, [contactId, open]);

  const handleEdit = () => {
    if (onEdit && contactId) {
      onEdit(contactId);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>{i18n.t("contacts.details.title")}</DialogTitle>
      <DialogContent dividers className={classes.dialogContent}>
        {loading ? (
          <div className={classes.loadingState}>
            <CircularProgress size={28} />
          </div>
        ) : !hasContact ? (
          <Paper variant="outlined" className={classes.statusCard}>
            <Typography variant="subtitle2">{i18n.t("common.error")}</Typography>
            <Typography variant="body2" className={classes.muted}>
              {i18n.t("contacts.details.unavailable")}
            </Typography>
          </Paper>
        ) : (
          <>
            <Paper variant="outlined" className={classes.heroCard}>
              <div className={classes.avatarFrame}>
                <ClickableContactAvatar
                  contact={contact}
                  avatarProps={{
                    className: classes.avatar
                  }}
                />
              </div>
              <div className={classes.heroInfo}>
                <Typography variant="overline" className={classes.overline}>
                  {i18n.t("contactModal.form.profile")}
                </Typography>
                <Typography variant="h5" className={classes.title} noWrap>
                  {contact?.name || "-"}
                </Typography>
                <div className={classes.infoGrid}>
                  <div className={classes.infoCard}>
                    <Typography variant="caption" className={classes.infoLabel}>
                      {i18n.t("contactModal.form.number")}
                    </Typography>
                    <Typography variant="body2">
                      <Link href={`tel:${contact?.number || ""}`}>
                        {contact?.number || "-"}
                      </Link>
                    </Typography>
                  </div>
                  <div className={classes.infoCard}>
                    <Typography variant="caption" className={classes.infoLabel}>
                      {i18n.t("contactModal.form.email")}
                    </Typography>
                    {contact?.email ? (
                      <Typography variant="body2">
                        <Link href={`mailto:${contact.email}`}>
                          {contact.email}
                        </Link>
                      </Typography>
                    ) : (
                      <Typography variant="body2" className={classes.muted}>
                        {i18n.t("contacts.details.emptyEmail")}
                      </Typography>
                    )}
                  </div>
                </div>
                <div className={classes.metadataRow}>
                  <Chip
                    size="small"
                    variant="outlined"
                    className={classes.metadataChip}
                    label={`${i18n.t("common.language")}: ${languageLabel}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    className={classes.metadataChip}
                    label={`${i18n.t("contacts.details.chatbot")}: ${chatbotStatus}`}
                  />
                </div>
              </div>
            </Paper>

            <Paper variant="outlined" className={classes.sectionCard}>
              <div className={classes.sectionHeader}>
                <Typography variant="subtitle2">
                  {i18n.t("contacts.details.tags")}
                </Typography>
                {contact?.tags?.length ? (
                  <Typography
                    variant="caption"
                    className={classes.sectionCount}
                  >
                    {contact.tags.length}
                  </Typography>
                ) : null}
              </div>
              {contact?.tags?.length ? (
                <div className={classes.chipRow}>
                  {contact.tags.map(tag => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      style={{
                        backgroundColor: tag.color,
                        color: "#fff"
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className={classes.emptyState}>
                  <Typography variant="body2" className={classes.muted}>
                    {i18n.t("contacts.details.emptyTags")}
                  </Typography>
                </div>
              )}
            </Paper>

            <Paper variant="outlined" className={classes.sectionCard}>
              <div className={classes.sectionHeader}>
                <Typography variant="subtitle2">
                  {i18n.t("contactModal.form.extraInfo")}
                </Typography>
                {contact?.extraInfo?.length ? (
                  <Typography
                    variant="caption"
                    className={classes.sectionCount}
                  >
                    {contact.extraInfo.length}
                  </Typography>
                ) : null}
              </div>
              {contact?.extraInfo?.length ? (
                <div className={classes.extraInfoList}>
                  {contact.extraInfo.map(info => (
                    <div
                      key={info.id || `${info.name}-${info.value}`}
                      className={classes.extraInfoItem}
                    >
                      <Typography variant="body2">
                        <strong>{info.name}</strong>
                      </Typography>
                      <Typography variant="body2" className={classes.muted}>
                        {info.value}
                      </Typography>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={classes.emptyState}>
                  <Typography variant="body2" className={classes.muted}>
                    {i18n.t("contacts.details.emptyExtraInfo")}
                  </Typography>
                </div>
              )}
            </Paper>
          </>
        )}
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onClose} color="secondary" variant="outlined">
          {i18n.t("contacts.details.close")}
        </Button>
        <Button
          onClick={handleEdit}
          color="primary"
          variant="contained"
          disabled={!hasContact}
        >
          {i18n.t("contacts.details.edit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDetailsModal;
