import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { MetaGraphApiError } from "./MetaGraphApiClient";
import ListTicketTemplatesService from "./ListTicketTemplatesService";
import PersistMetaOutboundMessageService from "./PersistMetaOutboundMessageService";
import SendMetaTemplateMessageService from "./SendMetaTemplateMessageService";

interface Request {
  ticket: Ticket;
  name: string;
  language?: string;
  parameters?: string[];
  userId?: number;
}

// Codigos de template invalido da Graph API: nome/idioma inexistente, template
// pausado ou parametros fora do formato aprovado.
const TEMPLATE_ERROR_CODES = [132000, 132001, 132005, 132007, 132012, 132015];

// A Meta entrega a mensagem ao cliente com as variaveis ja aplicadas; o chat
// precisa mostrar o mesmo texto, nao `{{1}}`.
export const renderTemplateBody = (
  body: string,
  parameters: string[]
): string =>
  body.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => {
    const value = parameters[Number(index) - 1];
    return value === undefined ? match : value;
  });

// Primeiro contato ativo e reengajamento fora da janela de 24h: o unico envio
// que a Meta aceita e um template aprovado.
const SendTicketTemplateService = async ({
  ticket,
  name,
  language,
  parameters = [],
  userId
}: Request): Promise<void> => {
  const connection = await Whatsapp.findByPk(ticket.whatsappId);

  if (!connection) {
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }

  if (connection.apiMode !== "official") {
    throw new AppError("ERR_WAPP_OFFICIAL_MODE_ONLY", 400);
  }

  if (connection.status !== "CONNECTED") {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED", 400);
  }

  const templates = await ListTicketTemplatesService(connection);
  const template = templates.find(
    item => item.name === name && (!language || item.language === language)
  );

  if (!template) {
    throw new AppError("ERR_META_TEMPLATE_NOT_APPROVED", 400);
  }

  if (parameters.length !== template.variables) {
    throw new AppError("ERR_META_TEMPLATE_INVALID", 400);
  }

  const to = ticket.contact.number.replace(/\D/g, "");

  try {
    const wamid = await SendMetaTemplateMessageService({
      whatsapp: connection,
      to,
      name: template.name,
      language: template.language,
      parameters
    });

    await PersistMetaOutboundMessageService({
      wamid,
      body: renderTemplateBody(template.body, parameters),
      ticket,
      userId
    });
  } catch (err) {
    if (
      err instanceof MetaGraphApiError &&
      TEMPLATE_ERROR_CODES.includes(err.graphCode)
    ) {
      logger.error(
        { ticketId: ticket.id, template: name, graphCode: err.graphCode },
        "Meta rejected the template message"
      );
      throw new AppError("ERR_META_TEMPLATE_INVALID", 400);
    }

    logger.error(
      { ticketId: ticket.id, template: name, message: err?.message },
      "Failed to send Meta template message"
    );
    throw err instanceof AppError ? err : new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendTicketTemplateService;
