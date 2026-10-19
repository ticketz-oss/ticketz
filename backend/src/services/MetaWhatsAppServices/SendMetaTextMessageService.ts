import {
  getMetaGraphApiClient,
  MetaGraphApiError,
  withAuth
} from "./MetaGraphApiClient";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import formatBody from "../../helpers/Mustache";
import User from "../../models/User";
import { logger } from "../../utils/logger";
import PersistMetaOutboundMessageService from "./PersistMetaOutboundMessageService";

interface Request {
  body: string;
  ticket: Ticket;
  connection: Whatsapp;
  userId?: number;
  quotedMsg?: Message;
}

export interface MetaSentMessage {
  key: { id: string; fromMe: true; remoteJid: string };
  message: { conversation: string };
}

// Envio cru, sem persistir: usado por quem ja grava a mensagem por conta
// propria (o adaptador de wbot oficial deixa o verifyMessage gravar, igual ao
// fluxo Baileys).
export const postMetaText = async (
  connection: Whatsapp,
  to: string,
  body: string,
  context?: { message_id: string }
): Promise<string> => {
  const { data } = await getMetaGraphApiClient().post(
    `/${connection.metaPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
      ...(context ? { context } : {})
    },
    withAuth(connection.metaAccessToken)
  );

  return data.messages[0].id as string;
};

// Equivalente ao SendWhatsAppMessage.ts, mas via WhatsApp Cloud API oficial:
// POST /{phoneNumberId}/messages, sem socket nenhum envolvido.
const SendMetaTextMessageService = async ({
  body,
  ticket,
  connection,
  userId,
  quotedMsg
}: Request): Promise<MetaSentMessage> => {
  if (!connection.metaPhoneNumberId || !connection.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  const client = getMetaGraphApiClient();
  const user = userId && (await User.findByPk(userId));
  const formattedBody = formatBody(body, ticket, user);
  const to = ticket.contact.number.replace(/\D/g, "");

  let context: { message_id: string } | undefined;
  if (quotedMsg) {
    const quoted = await Message.findByPk(quotedMsg.id);
    if (quoted?.id) {
      context = { message_id: quoted.id };
    }
  }

  try {
    const wamid = await postMetaText(connection, to, formattedBody, context);

    const sentMessage: MetaSentMessage = {
      key: { id: wamid, fromMe: true, remoteJid: to },
      message: { conversation: formattedBody }
    };

    await PersistMetaOutboundMessageService({
      wamid,
      body: formattedBody,
      ticket,
      userId,
      quotedMsgId: quotedMsg?.id
    });

    return sentMessage;
  } catch (err) {
    logger.error({ err, ticketId: ticket.id }, "Failed to send Meta message");

    // 131047: passaram mais de 24h desde a ultima mensagem do cliente. O erro
    // generico nao dizia ao atendente que ele precisa usar um template.
    if (err instanceof MetaGraphApiError && err.graphCode === 131047) {
      throw new AppError("ERR_META_WINDOW_CLOSED", 403);
    }

    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendMetaTextMessageService;
