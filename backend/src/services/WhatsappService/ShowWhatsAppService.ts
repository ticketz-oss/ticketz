import { FindOptions } from "sequelize/types";
import Whatsapp from "../../models/Whatsapp";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import Company from "../../models/Company";

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
          "mediaName",
          "order"
        ],
        include: [
          {
            model: QueueOption,
            as: "options",
            required: false,
            where: { parentId: null, isActive: true }
          }
        ]
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "language"]
      }
    ],
    // A ordem do menu vem das colunas "order" (arrastar e soltar no admin).
    // Antes era o nome da fila e um cast do campo "option" para inteiro.
    order: [
      ["queues", "order", "ASC"],
      ["queues", "name", "ASC"],
      ["queues", "options", "order", "ASC"]
    ]
  };

  // metaAccessToken nunca deve chegar ao frontend, independente de hideSession.
  findOptions.attributes = {
    exclude: options.hideSession
      ? ["session", "metaAccessToken"]
      : ["metaAccessToken"]
  };

  return Whatsapp.findByPk(id, findOptions);
};

export default ShowWhatsAppService;
