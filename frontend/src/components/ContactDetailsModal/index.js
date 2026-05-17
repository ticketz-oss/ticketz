import React, { useEffect, useState } from "react";

import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import ClickableContactAvatar from "../ClickableContactAvatar";

const useStyles = makeStyles(theme => ({
  hero: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: theme.spacing(0.5)
  },
  avatar: {
    width: 88,
    height: 88
  },
  muted: {
    color: theme.palette.text.secondary
  },
  section: {
    marginTop: theme.spacing(2)
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  extraInfoList: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  extraInfoItem: {
    padding: theme.spacing(1.25),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover
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
      <DialogContent dividers>
        {loading ? (
          <div className={classes.loadingState}>
            <CircularProgress size={28} />
          </div>
        ) : (
          <>
            <div className={classes.hero}>
              <ClickableContactAvatar
                contact={contact}
                avatarProps={{
                  style: classes.avatar
                }}
              />
              <div className={classes.heroInfo}>
                <Typography variant="h6" noWrap>
                  {contact?.name || "-"}
                </Typography>
                <Typography variant="body2">
                  <Link href={`tel:${contact?.number || ""}`}>
                    {contact?.number || "-"}
                  </Link>
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

            <Divider />

            <div className={classes.section}>
              <Typography variant="subtitle2">
                {i18n.t("contacts.details.tags")}
              </Typography>
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
                <Typography variant="body2" className={classes.muted}>
                  {i18n.t("contacts.details.emptyTags")}
                </Typography>
              )}
            </div>

            <div className={classes.section}>
              <Typography variant="subtitle2">
                {i18n.t("contactModal.form.extraInfo")}
              </Typography>
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
                <Typography variant="body2" className={classes.muted}>
                  {i18n.t("contacts.details.emptyExtraInfo")}
                </Typography>
              )}
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions>
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
