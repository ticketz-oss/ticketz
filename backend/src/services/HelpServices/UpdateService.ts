import AppError from "../../errors/AppError";
import Help from "../../models/Help";
import HelpGroup from "../../models/HelpGroup";

interface Data {
  id: number;
  groupId?: number;
  title?: string;
  description?: string;
  type?: string;
  video?: string | null;
  content?: string | null;
  duration?: string;
  link?: string;
  isActive?: boolean;
  adminOnly?: boolean;
}

const UpdateService = async (data: Data): Promise<Help> => {
  const { id } = data;

  const record = await Help.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_HELP_FOUND", 404);
  }

  // Trocar de card manda o conteudo para o fim da lista do card de destino,
  // senao ele herdaria uma posicao ja ocupada la.
  if (data.groupId && data.groupId !== record.groupId) {
    const group = await HelpGroup.findByPk(data.groupId);

    if (!group) {
      throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
    }

    const maxOrder = (await Help.max("order", {
      where: { groupId: group.id }
    })) as number | null;

    await record.update({
      ...data,
      order: Number.isInteger(maxOrder) ? maxOrder + 1 : 0
    });

    return record;
  }

  await record.update(data);

  return record;
};

export default UpdateService;
