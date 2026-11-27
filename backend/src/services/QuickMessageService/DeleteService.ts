import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";

const DeleteService = async (
  id: string,
  companyId: number
): Promise<void> => {
  const record = await QuickMessage.findOne({
    where: { id, companyId }
  });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  await record.destroy();
};

export default DeleteService;
