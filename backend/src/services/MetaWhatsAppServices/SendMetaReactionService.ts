import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";

interface Request {
  connection: Whatsapp;
  ticket: Ticket;
  messageId: string;
  emoji: string;
  userId?: number;
}

// Reagir existe na Cloud API (type: reaction), diferente de editar e excluir.
// A reacao e gravada como mensagem presa a original, mesma forma do Baileys,
// pro painel renderiza-la sob a mensagem reagida.
const SendMetaReactionService = async ({
  connection,
  ticket,
  messageId,
  emoji,
  userId
}: Request): Promise<void> => {
  if (connection.status !== "CONNECTED")
    throw new AppError("ERR_WAPP_NOT_INITIALIZED", 400);
  if (!connection.metaPhoneNumberId || !connection.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  const to = ticket.contact.number.replace(/\D/g, "");

  const { data } = await getMetaGraphApiClient().post(
    `/${connection.metaPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "reaction",
      // Emoji vazio remove a reacao, que e como a propria Meta desfaz.
      reaction: { message_id: messageId, emoji: emoji || "" }
    },
    withAuth(connection.metaAccessToken)
  );

  const wamid = data?.messages?.[0]?.id;

  if (!wamid) {
    throw new AppError("ERR_WHATSAPP_MESSAGE_NOT_SENT", 502);
  }

  await CreateMessageService({
    messageData: {
      id: wamid,
      ticketId: ticket.id,
      userId,
      body: emoji,
      fromMe: true,
      read: true,
      mediaType: "reactionMessage",
      quotedMsgId: messageId,
      ack: 1,
      dataJson: JSON.stringify({
        wamid,
        source: "meta-cloud-api",
        reaction: { message_id: messageId, emoji }
      })
    },
    companyId: ticket.companyId
  });
};

export default SendMetaReactionService;
