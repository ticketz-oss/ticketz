import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";
import { TEMPLATE_LANGUAGE } from "./MetaTemplateFormat";

interface Request {
  whatsapp: Whatsapp;
  to: string;
  name: string;
  parameters: string[];
  document?: { id: string; filename: string };
  // A cobranca so cria template em pt_BR, mas a WABA pode ter templates em
  // outros idiomas e a Meta casa nome + idioma.
  language?: string;
}

// Envia uma mensagem de template aprovado. E o unico caminho possivel para
// mensagem iniciada pela empresa (cobranca): texto livre so vale dentro da
// janela de 24h depois que o cliente escreve.
const SendMetaTemplateMessageService = async ({
  whatsapp,
  to,
  name,
  parameters,
  document,
  language
}: Request): Promise<string> => {
  if (!whatsapp.metaPhoneNumberId || !whatsapp.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  const components: Record<string, unknown>[] = [];

  if (document) {
    components.push({
      type: "header",
      parameters: [{ type: "document", document }]
    });
  }

  if (parameters.length) {
    components.push({
      type: "body",
      parameters: parameters.map(text => ({ type: "text", text }))
    });
  }

  const { data } = await getMetaGraphApiClient().post(
    `/${whatsapp.metaPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name,
        language: { code: language || TEMPLATE_LANGUAGE },
        ...(components.length ? { components } : {})
      }
    },
    withAuth(whatsapp.metaAccessToken)
  );

  const wamid = data?.messages?.[0]?.id;

  if (!wamid) {
    throw new AppError("ERR_WHATSAPP_MESSAGE_NOT_SENT", 502);
  }

  return wamid as string;
};

export default SendMetaTemplateMessageService;
