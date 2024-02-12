import { ShowBaileysChatService } from "./ShowBaileysChatService";

export const DeleteBaileysChatServices = async (
  whatsappId: number,
  jid: string,
): Promise<void> => {
  const showBaileysChatService = await ShowBaileysChatService(
    whatsappId,
    jid,
  );

  showBaileysChatService.destroy();
};
