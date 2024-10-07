import fs from "fs";
import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";

import { getMessageFileOptions } from "../services/WbotServices/SendWhatsAppMedia";
import { SubscriptionService } from "../ticketzPro/services/subscriptionService";

const subscriptionService = SubscriptionService.getInstance();

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData
): Promise<any> => {
  try {
    if (!subscriptionService.getTaskResult) {
      throw new Error("ERR_SUBSCRIPTION_CHECK_FAILED");
    }

    const wbot = await GetWhatsappWbot(whatsapp);
    const number = messageData.number.toString();
    const chatId = number.includes("@") ? number : `${number}@s.whatsapp.net`;

    let message: proto.WebMessageInfo;

    const body = `\u200e${messageData.body}`;

    if (messageData.mediaPath) {
      const options = await getMessageFileOptions(body, messageData.mediaPath);
      if (options) {
        message = await wbot.sendMessage(chatId, {
          ...options
        });
      }
    } else {
      message = await wbot.sendMessage(chatId, { text: body });
    }

    return message;
  } catch (err: any) {
    throw new Error(err);
  }
};
