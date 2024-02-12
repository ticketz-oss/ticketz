import AppError from "../../errors/AppError";
import BaileysChats from "../../models/BaileysChats";

export const ShowBaileysChatService = async (
  whatsappId: number,
  jid: string,
): Promise<BaileysChats> => {
  const baileysChat = await BaileysChats.findOne({
    where: {
      whatsappId,
      jid,
    }
  });

  if (baileysChat) {
    return baileysChat;
  }

};
