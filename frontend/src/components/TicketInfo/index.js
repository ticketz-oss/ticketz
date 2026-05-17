import React, { useState, useEffect } from "react";

import { Avatar, CardHeader } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";

const useStyles = makeStyles(theme => ({
  cardHeader: {
    cursor: "pointer",
    paddingTop: 8,
    paddingBottom: 8,
    "& .MuiCardHeader-content": {
      overflow: "hidden"
    }
  },
  title: {
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: theme.palette.textCommon,
    fontSize: "0.92rem"
  },
  subheader: {
    color: theme.palette.messageIcons,
    fontSize: "0.76rem",
    fontWeight: 500
  },
  avatar: {
    backgroundColor: props => generateColor(props?.contact?.number),
    color: "white",
    fontWeight: "bold",
    width: 38,
    height: 38,
    fontSize: "0.88rem"
  }
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
  const classes = useStyles({ contact });
  const { user } = ticket;
  const [userName, setUserName] = useState("");
  const [contactName, setContactName] = useState("");

  useEffect(() => {
    if (contact) {
      setContactName(contact.name);
      if (document.body.offsetWidth < 600) {
        if (contact.name.length > 10) {
          const truncadName = contact.name.substring(0, 10) + "...";
          setContactName(truncadName);
        }
      }
    }

    if (user && contact) {
      setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);

      if (document.body.offsetWidth < 600) {
        setUserName(`${user.name}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CardHeader
      onClick={onClick}
      className={classes.cardHeader}
      titleTypographyProps={{ noWrap: true }}
      subheaderTypographyProps={{ noWrap: true }}
      avatar={
        <Avatar
          className={classes.avatar}
          src={contact.profilePicUrl}
          alt="contact_image"
        >
          {getInitials(contact?.name)}
        </Avatar>
      }
      classes={{ title: classes.title, subheader: classes.subheader }}
      title={`${contactName} #${ticket.id}`}
      subheader={ticket.user && `${userName}`}
    />
  );
};

export default TicketInfo;
