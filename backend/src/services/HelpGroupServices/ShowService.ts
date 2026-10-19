import HelpGroup from "../../models/HelpGroup";
import AppError from "../../errors/AppError";

const ShowService = async (id: string | number): Promise<HelpGroup> => {
  const record = await HelpGroup.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  return record;
};

export default ShowService;
