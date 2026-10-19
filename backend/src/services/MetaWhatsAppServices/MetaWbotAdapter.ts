import fs from "fs";
import mime from "mime-types";
import path from "path";
import SendMetaMediaMessageService from "./SendMetaMediaMessageService";
import { proto } from "libzapitu-rf";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { Session } from "../../libs/wbot";
import SendMetaTextMessageService, {
  postMetaText
} from "./SendMetaTextMessageService";
import { postMetaInteractiveMenu } from "./SendMetaInteractiveMessageService";

// Saudacao, fora de horario, menu de fila, chatbot e avaliacao vivem no
// wbotMessageListener e usam texto, menus e midia - nenhuma delas chama
// API propria do Baileys. Este adaptador entrega um objeto com a mesma forma
// que elas esperam, para que o caminho oficial reaproveite a logica em vez de
// duplicar centenas de linhas (e voltar a divergir na proxima mudanca).
//
// O envio aqui e cru de proposito: quem chama grava a mensagem com
// verifyMessage logo depois, exatamente como no Baileys.
export const buildMetaWbot = (connection: Whatsapp): Session => {
  // Sem isso uma conexao carregada com attributes parciais (ShowTicketService
  // nao traz as credenciais) monta `POST /undefined/messages` sem token e a
  // Graph API responde OAuthException 190, um erro que nao diz nada sobre a
  // causa real.
  if (!connection?.metaPhoneNumberId || !connection?.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  return {
    id: connection.id,
    sendChatbotMedia: async (ticket, filePath, filename, caption) => {
      const stats = await fs.promises.stat(filePath);
      const mimetype =
        mime.lookup(filename || filePath) || "application/octet-stream";
      const separateCaption = mimetype.startsWith("audio/") && caption;
      await SendMetaMediaMessageService({
        connection,
        ticket,
        caption: separateCaption ? undefined : caption,
        media: {
          path: filePath,
          originalname: Buffer.from(
            filename || path.basename(filePath),
            "utf8"
          ).toString("latin1"),
          mimetype,
          size: stats.size
        } as Express.Multer.File
      });
      if (separateCaption) {
        await SendMetaTextMessageService({ connection, ticket, body: caption });
      }
    },
    sendMessage: async (jid: string, content: { text?: string }) => {
      const to = jid.replace(/\D/g, "");
      const body = content.text || "";
      const wamid = await postMetaText(connection, to, body);

      return {
        key: { id: wamid, fromMe: true, remoteJid: jid },
        message: { conversation: body },
        status: 1,
        messageTimestamp: Math.floor(Date.now() / 1000)
      };
    },
    sendMenuMessage: async (jid, body, options) => {
      const to = jid.replace(/\D/g, "");
      const wamid = await postMetaInteractiveMenu(
        connection,
        to,
        body,
        options
      );

      return {
        key: { id: wamid, fromMe: true, remoteJid: jid },
        // O historico interno registra o texto introdutorio; os botoes ficam
        // no payload da Meta e a resposta recebida guarda o titulo escolhido.
        message: { conversation: body },
        status: 1,
        messageTimestamp: Math.floor(Date.now() / 1000)
      };
    }
  } as unknown as Session;
};

// As mesmas funcoes leem o texto recebido via getBodyMessage(msg.message), que
// so precisa de conversation - o resto do proto nao e tocado.
export const metaInboundStub = (
  ticket: Ticket,
  body: string
): proto.IWebMessageInfo =>
  ({
    key: {
      id: `meta-inbound-${ticket.id}`,
      fromMe: false,
      remoteJid: `${ticket.contact?.number}@s.whatsapp.net`
    },
    message: { conversation: body }
  }) as unknown as proto.IWebMessageInfo;
