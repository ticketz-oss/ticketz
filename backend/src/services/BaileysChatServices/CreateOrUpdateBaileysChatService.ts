import { Chat } from "@whiskeysockets/baileys";
import BaileysChats from "../../models/BaileysChats";

export const CreateOrUpdateBaileysChatService = async (
  whatsappId: number,
  chat: Partial<Chat>,
): Promise<BaileysChats> => {
  const { id, conversationTimestamp, unreadCount } = chat;
  const baileysChat = await BaileysChats.findOne({
    where: {
      whatsappId,
      jid: id,
    }
  });

  if (baileysChat) {
    const baileysChats = await baileysChat.update({
      conversationTimestamp,
      unreadCount: unreadCount ? baileysChat.unreadCount + unreadCount : 0
    });

    return baileysChats;
  }
  // timestamp now

  const timestamp = new Date().getTime();

  // convert timestamp to number
  const conversationTimestampNumber = Number(timestamp);

  const baileysChats = await BaileysChats.create({
    whatsappId,
    jid: id,
    conversationTimestamp: conversationTimestamp || conversationTimestampNumber,
    unreadCount: unreadCount || 1,
  });

  return baileysChats;
};
