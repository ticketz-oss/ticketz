import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";

export interface MetaInteractiveOption {
  id: string;
  title: string;
}

const MAX_OPTIONS = 10;
const MAX_BODY_LENGTH = 1024;
const MAX_BUTTON_TITLE_LENGTH = 20;
const MAX_LIST_TITLE_LENGTH = 24;
const MAX_LIST_DESCRIPTION_LENGTH = 72;

const clean = (value: string): string =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, max: number): string => {
  const normalized = clean(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
};

export const buildMetaInteractive = (
  body: string,
  options: MetaInteractiveOption[]
): Record<string, unknown> => {
  const normalized = options
    .map(option => ({ id: clean(option.id), title: clean(option.title) }))
    .filter(option => option.id && option.title);

  if (!normalized.length || normalized.length > MAX_OPTIONS) {
    throw new AppError("ERR_META_INTERACTIVE_OPTIONS", 400);
  }

  const text = truncate(body, MAX_BODY_LENGTH) || "Selecione uma opção:";
  const canUseButtons =
    normalized.length <= 3 &&
    normalized.every(option => option.title.length <= MAX_BUTTON_TITLE_LENGTH);

  if (canUseButtons) {
    return {
      type: "button",
      body: { text },
      action: {
        buttons: normalized.map(option => ({
          type: "reply",
          reply: { id: option.id, title: option.title }
        }))
      }
    };
  }

  return {
    type: "list",
    body: { text },
    action: {
      button: "Ver opções",
      sections: [
        {
          title: "Opções",
          rows: normalized.map(option => ({
            id: option.id,
            title: truncate(option.title, MAX_LIST_TITLE_LENGTH),
            ...(option.title.length > MAX_LIST_TITLE_LENGTH
              ? {
                  description: truncate(
                    option.title,
                    MAX_LIST_DESCRIPTION_LENGTH
                  )
                }
              : {})
          }))
        }
      ]
    }
  };
};

export const postMetaInteractiveMenu = async (
  connection: Whatsapp,
  to: string,
  body: string,
  options: MetaInteractiveOption[]
): Promise<string> => {
  if (!connection.metaPhoneNumberId || !connection.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  const { data } = await getMetaGraphApiClient().post(
    `/${connection.metaPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: buildMetaInteractive(body, options)
    },
    withAuth(connection.metaAccessToken)
  );

  return data.messages[0].id as string;
};
