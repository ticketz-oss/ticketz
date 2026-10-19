import Ticket from "../../models/Ticket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { mediaLabel } from "./mediaLabel";

interface MediaPayload {
  mediaUrl: string;
  mimetype: string;
  filename: string;
  kind: "image" | "audio" | "video" | "document";
}

interface Request {
  wamid: string;
  body: string;
  ticket: Ticket;
  userId?: number;
  quotedMsgId?: string;
  media?: MediaPayload;
}

// Persiste uma mensagem enviada via Cloud API como Message, no mesmo
// contrato que o restante do sistema espera (ticket.lastMessage, socket.io,
// contagem de nao lidas etc.) - equivalente ao que verifyMessage faz para o
// fluxo Baileys, mas sem nenhum WAMessage/proto envolvido.
const PersistMetaOutboundMessageService = async ({
  wamid,
  body,
  ticket,
  userId,
  quotedMsgId,
  media
}: Request) => {
  // Documento e o unico caso em que o nome do arquivo diz algo ao atendente; um
  // audio gravado no navegador viraria "audio-record-site-...ogg" na lista.
  const preview = media
    ? `📎 ${mediaLabel(
        media.kind,
        media.kind === "document" ? media.filename : undefined
      )}`
    : body;

  await ticket.update({
    lastMessage: preview.substring(0, 255).replace(/\n/g, " ")
  });

  const dataJson: Record<string, unknown> = {
    wamid,
    body,
    source: "meta-cloud-api"
  };

  if (media) {
    dataJson.mimetype = media.mimetype;
    // O MessagesList decide o render lendo o dataJson: sem documentMessage um
    // PDF cai no branch de video e perde a previa e o botao de download.
    if (media.kind === "document") {
      dataJson.message = {
        documentMessage: {
          fileName: media.filename,
          mimetype: media.mimetype
        }
      };
    }
  }

  const messageData = {
    id: wamid,
    ticketId: ticket.id,
    userId,
    contactId: undefined,
    body,
    fromMe: true,
    read: true,
    quotedMsgId,
    ack: 1,
    ...(media
      ? {
          mediaUrl: media.mediaUrl,
          mediaType: media.mimetype.split("/")[0]
        }
      : {}),
    dataJson: JSON.stringify(dataJson),
    isEdited: false
  };

  return CreateMessageService({ messageData, companyId: ticket.companyId });
};

export default PersistMetaOutboundMessageService;
