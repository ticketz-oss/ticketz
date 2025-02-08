import React, { useState, useContext } from "react";
import PropTypes from "prop-types";

import MenuItem from "@material-ui/core/MenuItem";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import { Menu } from "@material-ui/core";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import toastError from "../../errors/toastError";
import MessageHistoryModal from "../MessageHistoryModal";
import MessageForwardModal from "../MessageForwardModal";

const MessageOptionsMenu = ({ message, data, menuOpen, handleClose, anchorEl }) => {
	const { setReplyingMessage } = useContext(ReplyMessageContext);
 	const editingContext = useContext(EditMessageContext);
 	const setEditingMessage = editingContext ? editingContext.setEditingMessage : null;
 	
	const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
	const [messageHistoryOpen, setMessageHistoryOpen] = useState(false);

	const handleDeleteMessage = async () => {
		try {
			await api.delete(`/messages/${message.id}`);
		} catch (err) {
			toastError(err);
		}
	};

	const handleReplyMessage = () => {
		setReplyingMessage(message);
		handleClose();
	};

	const handleOpenConfirmationModal = e => {
		setConfirmationOpen(true);
		handleClose();
	};
	
	const handleEditMessage = async () => {
		setEditingMessage(message);
		handleClose();
	}
	
	const handleOpenMessageHistoryModal = (e) => {
		setMessageHistoryOpen(true);
		handleClose();
	}
  
  const handleOpenForwardModal = (e) => {
    setForwardModalOpen(true);
    handleClose();
  }

  const isSticker = data?.message && ("stickerMessage" in data.message);

	return (
		<>
			<ConfirmationModal
				title={i18n.t("messageOptionsMenu.confirmationModal.title")}
				open={confirmationOpen}
				onClose={setConfirmationOpen}
				onConfirm={handleDeleteMessage}
			>
				{i18n.t("messageOptionsMenu.confirmationModal.message")}
			</ConfirmationModal>
      <MessageHistoryModal
        open={messageHistoryOpen}
        onClose={setMessageHistoryOpen}
        oldMessages={message.oldMessages}
      >
      </MessageHistoryModal>
      <MessageForwardModal
        modalOpen={forwardModalOpen}
        onClose={setForwardModalOpen}
        ticketId={message.ticketId}
        messageId={message.id}
      />
			<Menu
				anchorEl={anchorEl}
				getContentAnchorEl={null}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				open={menuOpen}
				onClose={handleClose}
			>
				{message.fromMe && [
					<MenuItem key="delete" onClick={handleOpenConfirmationModal}>
						{i18n.t("messageOptionsMenu.delete")}
					</MenuItem>,
          !isSticker && (
            <MenuItem key="edit" onClick={handleEditMessage}>
              {i18n.t("messageOptionsMenu.edit")}
            </MenuItem>
			    )]}
				{!isSticker && message.oldMessages?.length > 0 && (
					<MenuItem key="history" onClick={handleOpenMessageHistoryModal}>
	                    {i18n.t("messageOptionsMenu.history")}
				    </MenuItem>
				)}
				<MenuItem onClick={handleReplyMessage}>
					{i18n.t("messageOptionsMenu.reply")}
				</MenuItem>
        <MenuItem key="forward" onClick={handleOpenForwardModal}>
          {i18n.t("messageOptionsMenu.forward")}
        </MenuItem>
        </Menu>
		</>
	);
};

MessageOptionsMenu.propTypes = {
  message: PropTypes.object,
  menuOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  anchorEl: PropTypes.object
}

export default MessageOptionsMenu;
