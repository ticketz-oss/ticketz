import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";

interface Data {
  shortcode: string;
  message: string;
  userId: number;
  id?: number;
  companyId: number;
}

const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, shortcode, message, userId, companyId } = data;

  const record = await QuickMessage.findByPk(id);

  if (!record || record.companyId !== companyId) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  await record.update({
    shortcode,
    message,
    userId
  });

  return record;
};

export default UpdateService;
