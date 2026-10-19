import HelpGroup from "../../models/HelpGroup";
import AppError from "../../errors/AppError";

/**
 * Apagar o card apaga os conteudos dentro dele (FK ON DELETE CASCADE).
 */
const DeleteService = async (id: string | number): Promise<void> => {
  const record = await HelpGroup.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  await record.destroy();
};

export default DeleteService;
