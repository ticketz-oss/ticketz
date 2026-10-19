import mime from "mime-types";
import Whatsapp from "../../models/Whatsapp";
import FindOrCreateTicketServiceMeta from "../TicketServices/FindOrCreateTicketServiceMeta";
import CreateMessageService from "../MessageServices/CreateMessageService";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { logger } from "../../utils/logger";
import DownloadMetaMediaService from "./DownloadMetaMediaService";
import { mediaLabel } from "./mediaLabel";
import HandleMetaInboundFlowService, {
  captureMetaRating
} from "./HandleMetaInboundFlowService";
import FindOrCreateMetaContactService from "./FindOrCreateMetaContactService";

interface MetaContact {
  profile?: { name?: string };
  wa_id: string;
}

interface MetaMediaPayload {
  id: string;
  mime_type?: string;
  filename?: string;
  caption?: string;
  voice?: boolean;
}

interface MetaInboundMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: MetaMediaPayload;
  audio?: MetaMediaPayload;
  video?: MetaMediaPayload;
  document?: MetaMediaPayload;
  sticker?: MetaMediaPayload;
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
  };
  contacts?: {
    name?: { formatted_name?: string };
    phones?: { phone?: string }[];
  }[];
  reaction?: { message_id?: string; emoji?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  order?: { product_items?: unknown[] };
  errors?: { title?: string; message?: string }[];
}

const MEDIA_TYPES = ["image", "audio", "video", "document", "sticker"];

// O atendente ve o titulo escolhido, mas o motor do fluxo precisa do id
// estavel enviado no botao/lista ("1", "2", "#"...). Usar o titulo para os
// dois fins fazia a escolha nativa nunca casar com QueueOption.option.
const flowInput = (message: MetaInboundMessage): string => {
  if (message.type === "button") {
    return message.button?.payload || message.button?.text || "";
  }

  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      ""
    );
  }

  return describe(message);
};

// Tudo que nao e midia vira texto legivel. O que nao existe aqui some da tela
// sem deixar rastro, e o atendente nem fica sabendo que chegou algo - por isso
// ate o tipo desconhecido tem um corpo de fallback.
const describe = (message: MetaInboundMessage): string => {
  if (message.type === "text") return message.text?.body || "";

  if (message.type === "location") {
    const place = [message.location?.name, message.location?.address]
      .filter(Boolean)
      .join(" - ");
    const coords = `${message.location?.latitude},${message.location?.longitude}`;
    return `📍 ${place || "Localização recebida"}\nhttps://www.google.com/maps/search/?api=1&query=${coords}`;
  }

  if (message.type === "contacts") {
    return (message.contacts || [])
      .map(contact => {
        const name = contact.name?.formatted_name || "Contato";
        const phones = (contact.phones || [])
          .map(phone => phone.phone)
          .filter(Boolean)
          .join(", ");
        return `👤 ${name}${phones ? ` - ${phones}` : ""}`;
      })
      .join("\n");
  }

  if (message.type === "reaction") return message.reaction?.emoji || "reaction";

  if (message.type === "button") return message.button?.text || "";

  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      ""
    );
  }

  if (message.type === "order") {
    const items = message.order?.product_items?.length || 0;
    return `🛒 Pedido recebido${items ? ` (${items} ${items === 1 ? "item" : "itens"})` : ""}`;
  }

  if (message.type === "errors") {
    const first = message.errors?.[0];
    return `⚠️ ${first?.title || "Erro"}${first?.message ? `: ${first.message}` : ""}`;
  }

  return `[mensagem não suportada: ${message.type}]`;
};

// Recebe uma mensagem entrante do payload do webhook Cloud API: texto e as
// midias que a Meta entrega por id (baixadas na hora, ver
// DownloadMetaMediaService).
const HandleMetaInboundMessageService = async (
  whatsapp: Whatsapp,
  metaContact: MetaContact | undefined,
  message: MetaInboundMessage
): Promise<void> => {
  const isMedia = MEDIA_TYPES.includes(message.type);

  if (!isMedia && !message.type) {
    logger.warn(
      { whatsappId: whatsapp.id },
      "Meta inbound message without type"
    );
    return;
  }

  const contact = await FindOrCreateMetaContactService({
    name: metaContact?.profile?.name || message.from,
    number: message.from,
    companyId: whatsapp.companyId
  });

  // Antes de criar/reabrir o ticket: a resposta da avaliacao so e reconhecida
  // enquanto o ticket anterior ainda esta fechado.
  if (
    !isMedia &&
    (await captureMetaRating(whatsapp, contact, describe(message)))
  ) {
    return;
  }

  const { ticket, justCreated } = await FindOrCreateTicketServiceMeta(
    contact,
    whatsapp.id,
    1,
    whatsapp.companyId,
    "whatsapp"
  );

  const payload = isMedia
    ? (message[message.type as keyof MetaInboundMessage] as MetaMediaPayload)
    : undefined;

  const body = isMedia ? payload?.caption || "" : describe(message);
  let media: {
    mediaUrl: string;
    mimetype: string;
    filename: string;
    label: string;
  } | null = null;

  if (payload?.id) {
    const downloaded = await DownloadMetaMediaService(whatsapp, payload.id);
    const mimetype = payload.mime_type?.split(";")[0] || downloaded.mimetype;
    // So documento chega com nome de verdade; nos outros tipos inventamos um a
    // partir do wamid, que serve pra gravar em disco mas nao pode ir pra tela.
    const filename =
      payload.filename || `${message.id}.${mime.extension(mimetype) || "bin"}`;

    media = {
      mediaUrl: await saveMediaToFile(
        { data: downloaded.content, mimetype, filename },
        { destination: ticket }
      ),
      mimetype,
      filename,
      label: mediaLabel(message.type, payload.filename)
    };
  }

  const dataJson: Record<string, unknown> = {
    wamid: message.id,
    source: "meta-cloud-api"
  };

  const selectionId = flowInput(message);
  if (selectionId && selectionId !== body) {
    dataJson.interactiveSelectionId = selectionId;
  }

  if (media) {
    dataJson.mimetype = media.mimetype;
    // Mesmo contrato do envio: o MessagesList precisa do documentMessage pra
    // renderizar previa e botao de download em vez de um video quebrado.
    if (message.type === "document") {
      dataJson.message = {
        documentMessage: {
          fileName: media.filename,
          mimetype: media.mimetype
        }
      };
    }
    if (message.type === "sticker") {
      dataJson.message = { stickerMessage: { mimetype: media.mimetype } };
    }
  }

  const sentAt = new Date(Number(message.timestamp) * 1000);
  const validSentAt =
    Number.isFinite(sentAt.getTime()) &&
    sentAt.getTime() > 0 &&
    sentAt.getTime() <= Date.now();
  const messageData = {
    ...(validSentAt ? { createdAt: sentAt } : {}),
    id: message.id,
    ticketId: ticket.id,
    contactId: contact.id,
    body,
    fromMe: false,
    read: false,
    ack: 2,
    ...(media
      ? {
          mediaUrl: media.mediaUrl,
          mediaType: media.mimetype.split("/")[0]
        }
      : {}),
    // Mesma forma do Baileys: a reacao e uma mensagem presa a original, e o
    // MessagesList a renderiza sob ela em vez de como mensagem solta.
    ...(message.type === "reaction"
      ? {
          mediaType: "reactionMessage",
          quotedMsgId: message.reaction?.message_id
        }
      : {}),
    dataJson: JSON.stringify(dataJson)
  };

  await CreateMessageService({ messageData, companyId: whatsapp.companyId });

  await ticket.update({
    lastMessage: (media ? `📎 ${media.label}` : body)
      .substring(0, 255)
      .replace(/\n/g, " "),
    ...(ticket.status === "closed" ? { status: "pending" } : {})
  });

  await HandleMetaInboundFlowService({
    connection: whatsapp,
    ticket,
    contact,
    body: selectionId,
    justCreated
  });
};

export default HandleMetaInboundMessageService;
