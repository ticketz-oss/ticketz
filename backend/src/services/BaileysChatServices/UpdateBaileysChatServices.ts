import AppError from "../../errors/AppError";
import BaileysChats from "../../models/BaileysChats";

interface Data {
  id?: string;
  conversationTimestamp?: number;
  unreadCount?: number;
}

export const UpdateBaileysChatServices = async (
  whatsappId: number,
  jid: string,
  data: Data
): Promise<BaileysChats> => {
  const baileysChat = await BaileysChats.findOne({
    where: {
      whatsappId,
      jid
    }
  });

  if (baileysChat) {
    await baileysChat.update({
      conversationTimestamp: data.conversationTimestamp,
      unreadCount: data.unreadCount
    });

    return baileysChat;
  }
};
