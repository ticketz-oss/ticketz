import { FindOptions } from "sequelize/types";
import { Sequelize } from "sequelize-typescript";
import Whatsapp from "../../models/Whatsapp";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";

type ShowWhatsAppOptions = {
  hideSession?: boolean;
};

const ShowWhatsAppService = async (
  id: string | number,
  options: ShowWhatsAppOptions = {}
): Promise<Whatsapp> => {
  const findOptions: FindOptions = {
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: [
          "id",
          "name",
          "color",
          "greetingMessage",
          "outOfHoursMessage",
          "mediaPath",
          "mediaName"
        ],
        include: [
          {
            model: QueueOption,
            as: "options",
            required: false,
            where: { parentId: null }
          }
        ]
      }
    ],
    order: [
      ["queues", "name", "ASC"],
      [Sequelize.cast(Sequelize.col("queues.options.option"), "INTEGER"), "ASC"]
    ]
  };

  if (options.hideSession) {
    findOptions.attributes = { exclude: ["session"] };
  }

  return Whatsapp.findByPk(id, findOptions);
};

export default ShowWhatsAppService;
