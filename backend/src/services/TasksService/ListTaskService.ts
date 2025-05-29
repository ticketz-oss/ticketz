import { Op } from "sequelize";
import Tasks from "../../models/Tasks";
import User from "../../models/User";


interface Request {
  userId: number,
  companyId: number;
  profile: string;
}

export const ListTaskService = async ({ userId, companyId, profile }: Request): Promise<Tasks[]> => {

  let tasks: Tasks[] = [];

  if (profile === 'admin') {

    tasks = await Tasks.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name',] },
      ],
      where: {
        companyId,
      },
    });

  } else {
    tasks = await Tasks.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name',] },
      ],
      where: {
        [Op.or]: [
          {
            userId, // Tarefas do userId específico
          },
          {
            [Op.and]: [
              { isPrivate: false }, // Tarefas com isPrivate igual a false
              { companyId }, // Tarefas com companyId específico
            ],
          },
        ],
      },
    });
  }

  return tasks;

}
