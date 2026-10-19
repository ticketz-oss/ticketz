import React, { useState, useEffect } from "react";

import { CardHeader } from "@material-ui/core";
import AvatarContato from "../AvatarContato";

import { i18n } from "../../translate/i18n";
import {
  formatWhatsappContactName,
  formatWhatsappContactNumber
} from "../../helpers/formatWhatsappDisplay";
import { getInitials } from "../../helpers/getInitials";
import { corAvatar as generateColor } from "../../helpers/coresAvatar";

const TicketInfo = ({ contact, ticket, onClick }) => {
  const { user } = ticket;
  const [userName, setUserName] = useState("");

  const contactName = contact ? formatWhatsappContactName(contact, ticket) : "";
  useEffect(() => {
    if (user && contact) {
      setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);

      if (document.body.offsetWidth < 600) {
        setUserName(`${user.name}`);
      }
    }
  }, [contact, user]);

  return (
    <>
      <CardHeader
        onClick={onClick}
        style={{ cursor: "pointer" }}
        titleTypographyProps={{ noWrap: true }}
        subheaderTypographyProps={{ noWrap: true }}
        avatar={
          <AvatarContato
            style={{
              backgroundColor: generateColor(contact?.number),
              color: "white",
              fontWeight: "bold"
            }}
            contact={contact}
            alt={contactName}
            preview
          >
            {getInitials(contactName)}
          </AvatarContato>
        }
        title={contactName}
        subheader={formatWhatsappContactNumber(contact) || userName}
      />
    </>
  );
};

export default TicketInfo;
