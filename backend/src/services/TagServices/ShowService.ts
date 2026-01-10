import Tag from "../../models/Tag";
import AppError from "../../errors/AppError";

const TagService = async (id: number, companyId: number): Promise<Tag> => {
  const tag = await Tag.findOne({
    where: { id, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  return tag;
};

export default TagService;
