import React, { useContext, useEffect, useRef, useState } from "react";

import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import toastError from "../../errors/toastError";
import { Can } from "../Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import GroupConfigModal from "../GroupConfigModal";

import ScheduleModal from "../ScheduleModal";

const TicketOptionsMenu = ({
  ticket,
  menuOpen,
  handleClose,
  anchorEl,
  showTabGroups,
  children
}) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(null);
  const [groupConfigOpen, setGroupConfigOpen] = useState(false);
  const isGroupConversation =
    ticket.isGroup && ticket.contact?.groupMode !== "ticket";

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenConfirmationModal = e => {
    setConfirmationOpen(true);
    handleClose();
  };

  const handleOpenTransferModal = e => {
    setTransferTicketModalOpen(true);
    handleClose();
  };

  const handleCloseTransferTicketModal = () => {
    if (isMounted.current) {
      setTransferTicketModalOpen(false);
    }
  };

  const handleOpenScheduleModal = () => {
    handleClose();
    setContactId(ticket.contact.id);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setContactId(null);
  };

  return (
    <>
      {children?.({
        transferir: handleOpenTransferModal,
        agendar: handleOpenScheduleModal,
        configurarGrupo: () => setGroupConfigOpen(true)
      })}
      <Menu
        className="conversa-menu"
        id="menu-appbar"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        open={menuOpen}
        onClose={handleClose}
      >
        {ticket.isGroup && (
          <MenuItem
            onClick={() => {
              handleClose();
              setGroupConfigOpen(true);
            }}
          >
            {i18n.t("whatsappGroups.configure")}
          </MenuItem>
        )}
        {!ticket.isGroup && (
          <MenuItem onClick={handleOpenScheduleModal}>
            {i18n.t("ticketOptionsMenu.schedule")}
          </MenuItem>
        )}
        {!isGroupConversation && (
          <MenuItem onClick={handleOpenTransferModal}>
            {i18n.t("ticketOptionsMenu.transfer")}
          </MenuItem>
        )}
        {!isGroupConversation && (
          <Can
            role={user.profile}
            perform="ticket-options:deleteTicket"
            yes={() => (
              <MenuItem onClick={handleOpenConfirmationModal}>
                {i18n.t("ticketOptionsMenu.delete")}
              </MenuItem>
            )}
          />
        )}
      </Menu>
      <ConfirmationModal
        title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")} #${
          ticket.id
        } ${ticket.contact.name}?`}
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={handleDeleteTicket}
      >
        {i18n.t("ticketOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
      <TransferTicketModalCustom
        modalOpen={transferTicketModalOpen}
        onClose={handleCloseTransferTicketModal}
        ticketid={ticket.id}
        hideUserSelection={isGroupConversation}
      />
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        aria-labelledby="form-dialog-title"
        contactId={contactId}
      />
      <GroupConfigModal
        open={groupConfigOpen}
        onClose={() => setGroupConfigOpen(false)}
        ticket={ticket}
      />
    </>
  );
};

export default TicketOptionsMenu;
