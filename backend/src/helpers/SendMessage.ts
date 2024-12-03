import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import { getMessageOptions } from "../services/WbotServices/SendWhatsAppMedia";
import { handleMessage } from "../services/WbotServices/wbotMessageListener";

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
  saveOnTicket?: boolean;
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    const number = messageData.number.toString();
    const chatId = number.includes("@") ? number : `${number}@s.whatsapp.net`;

    let message: proto.WebMessageInfo;

    const body = `${messageData.body}`;

    if (messageData.mediaPath) {
      const options = await getMessageOptions(body, messageData.mediaPath);
      if (options) {
        message = await wbot.sendMessage(chatId, {
          ...options
        });
      }
    } else {
      message = await wbot.sendMessage(chatId, { text: body });
    }

    if (messageData.saveOnTicket) {
      handleMessage(
        message,
        await GetWhatsappWbot(whatsapp),
        whatsapp.companyId
      );
    }

    return message;
  } catch (err: any) {
    throw new Error(err);
  }
};
