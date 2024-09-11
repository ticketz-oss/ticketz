import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import { FindOptions, Op } from "sequelize/types";

const ShowWhatsAppService = async (
  id: string | number,
  companyId: number,
  session?: any
): Promise<Whatsapp> => {
  const findOptions: FindOptions = {
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage","mediaPath", "mediaName"],
        include: [
          {
            model: QueueOption,
            as: "options",
            required: false,
            where: { parentId: null },
          }
        ]
      }
    ],
    order: [
      ["queues", "name", "ASC"],
      ["queues", "options", "option", "ASC"],
    ]
  };

  if (session !== undefined && session === 0) {
    findOptions.attributes = { exclude: ["session"] };
  }

  const whatsapp = await Whatsapp.findByPk(id, findOptions);

  if (whatsapp?.companyId !== companyId) {
    throw new AppError("Não é possível acessar registros de outra empresa");
  }

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return whatsapp;
};

export default ShowWhatsAppService;
