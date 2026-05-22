import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Link from "@material-ui/core/Link";
import InputLabel from "@material-ui/core/InputLabel";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import WhatsMarked from "react-whatsmarked";
import { CardHeader } from "@material-ui/core";
import ContactModal from "../ContactModal";
import { TicketNotes } from "../TicketNotes";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { TagsContainer } from "../TagsContainer";
import useSettings from "../../hooks/useSettings";

const drawerWidth = 320;

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    [theme.breakpoints.down(1400)]: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0
    }
  },

  drawerHidden: {
    display: "none"
  },

  drawerPaper: {
    width: drawerWidth,
    display: "flex",
    borderTop: `1px solid ${theme.palette.backgroundContrast.border}`,
    borderRight: `1px solid ${theme.palette.backgroundContrast.border}`,
    borderBottom: `1px solid ${theme.palette.backgroundContrast.border}`,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: theme.palette.background.default,
    boxShadow:
      theme.mode === "light"
        ? "0 20px 36px -22px rgba(0,0,0,0.45)"
        : "0 28px 44px -24px rgba(0,0,0,0.78)"
  },
  header: {
    display: "flex",
    borderBottom: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper,
    alignItems: "center",
    padding: theme.spacing(0, 1.2),
    minHeight: "64px",
    justifyContent: "flex-start"
  },
  headerTitle: {
    fontWeight: 600,
    letterSpacing: "-0.01em"
  },
  content: {
    display: "flex",

    flexDirection: "column",
    padding: "12px",
    gap: theme.spacing(1),
    height: "100%",
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  contactCardHeader: {
    cursor: "pointer",
    width: "100%",
    padding: 0
  },
  contactCardAvatar: {
    width: 60,
    height: 60,
    color: "white",
    fontWeight: "bold"
  },
  contactName: {
    fontWeight: 600,
    letterSpacing: "-0.01em"
  },
  contactLink: {
    fontSize: 12
  },

  contactAvatar: {
    margin: 15,
    width: 100,
    height: 100
  },

  contactHeader: {
    display: "flex",
    padding: 10,
    borderRadius: 12,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    "& > *": {
      margin: 4
    }
  },

  contactDetails: {
    marginTop: 2,
    padding: 10,
    borderRadius: 12,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    flexDirection: "column"
  },
  contactExtraInfo: {
    marginTop: 2,
    padding: 10,
    borderRadius: 12,
    border: `1px solid ${theme.palette.backgroundContrast.border}`,
    backgroundColor: theme.palette.background.paper
  },
  editButton: {
    alignSelf: "stretch",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "none"
  },
  notesTitle: {
    marginBottom: 10
  }
}));

const ContactDrawer = ({
  open,
  handleDrawerClose,
  contact,
  ticket,
  loading
}) => {
  const classes = useStyles();
  const { getSetting } = useSettings();

  const [modalOpen, setModalOpen] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    getSetting("tagsMode").then(res => {
      setShowTags(["contact", "both"].includes(res));
    });

    setOpenForm(false);
  }, [open, contact]);

  return (
    <>
      <Drawer
        className={open ? classes.drawer : classes.drawerHidden}
        variant="persistent"
        anchor="right"
        open={open}
        PaperProps={{ style: { position: "absolute" } }}
        BackdropProps={{ style: { position: "absolute" } }}
        ModalProps={{
          container: document.getElementById("drawer-container"),
          style: { position: "absolute" }
        }}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={classes.header}>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
          <Typography className={classes.headerTitle}>
            {i18n.t("contactDrawer.header")}
          </Typography>
        </div>
        {loading ? (
          <ContactDrawerSkeleton classes={classes} />
        ) : (
          <div className={classes.content}>
            <div className={classes.contactHeader}>
              <CardHeader
                onClick={() => {}}
                className={classes.contactCardHeader}
                titleTypographyProps={{ noWrap: true }}
                subheaderTypographyProps={{ noWrap: true }}
                avatar={
                  <Avatar
                    src={contact.profilePicUrl}
                    alt="contact_image"
                    className={classes.contactCardAvatar}
                    style={{ backgroundColor: generateColor(contact?.number) }}
                  >
                    {getInitials(contact?.name)}
                  </Avatar>
                }
                title={
                  <>
                    <Typography className={classes.contactName}>{contact.name}</Typography>
                  </>
                }
                subheader={
                  <>
                    <Typography className={classes.contactLink}>
                      <Link href={`tel:${contact.number}`}>
                        {contact.number}
                      </Link>
                    </Typography>
                    <Typography className={classes.contactLink}>
                      <Link href={`mailto:${contact.email}`}>
                        {contact.email}
                      </Link>
                    </Typography>
                  </>
                }
              />
            </div>
            {showTags && <TagsContainer contact={contact} />}
            {contact?.extraInfo?.length > 0 && (
              <div className={classes.contactExtraInfo}>
                <Typography variant="subtitle1">
                  {i18n.t("contactModal.form.extraInfo")}
                </Typography>
                {contact?.extraInfo?.map(info => (
                  <WhatsMarked>{`*${info?.name}:* ${info?.value}`}</WhatsMarked>
                ))}
              </div>
            )}
            <Button
              variant="outlined"
              color="primary"
              className={classes.editButton}
              onClick={() => setModalOpen(!openForm)}
            >
              {i18n.t("contactDrawer.buttons.edit")}
            </Button>
            <Paper square variant="outlined" className={classes.contactDetails}>
              <Typography variant="subtitle1" className={classes.notesTitle}>
                {i18n.t("ticketOptionsMenu.appointmentsModal.title")}
              </Typography>
              <TicketNotes ticket={ticket} />
            </Paper>
            <ContactModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              contactId={contact.id}
            ></ContactModal>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default ContactDrawer;
