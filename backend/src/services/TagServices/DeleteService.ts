import Tag from "../../models/Tag";
import AppError from "../../errors/AppError";

const DeleteService = async (id: number, companyId: number): Promise<void> => {
  const tag = await Tag.findOne({
    where: { id, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  await tag.destroy();
};

export default DeleteService;
