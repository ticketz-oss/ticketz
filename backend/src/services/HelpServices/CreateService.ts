import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Help from "../../models/Help";
import HelpGroup from "../../models/HelpGroup";

interface Data {
  groupId: number;
  title: string;
  description?: string;
  type?: string;
  video?: string | null;
  content?: string | null;
  duration?: string;
  link?: string;
  isActive?: boolean;
  adminOnly?: boolean;
}

const CreateService = async (data: Data): Promise<Help> => {
  const { title, description } = data;

  const helpSchema = Yup.object().shape({
    title: Yup.string()
      .min(3, "ERR_HELP_INVALID_NAME")
      .required("ERR_HELP_REQUIRED"),
    description: Yup.string().min(3, "ERR_HELP_INVALID_NAME")
  });

  try {
    // Descricao e opcional: string vazia nao pode cair no min(3).
    await helpSchema.validate({ title, description: description || undefined });
  } catch (err) {
    throw new AppError(err.message);
  }

  const group = await HelpGroup.findByPk(data.groupId);

  if (!group) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  // Entra no fim da lista do proprio card.
  const maxOrder = (await Help.max("order", {
    where: { groupId: group.id }
  })) as number | null;

  const record = await Help.create({
    ...data,
    groupId: group.id,
    order: Number.isInteger(maxOrder) ? maxOrder + 1 : 0
  } as Help);

  return record;
};

export default CreateService;
