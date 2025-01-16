import { FindOptions, Op } from "sequelize";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";

interface Request {
  companyId: number;
  queueId?: number;
  session?: number | string;
}

const ListWhatsAppsService = async ({
  session,
  queueId,
  companyId
}: Request): Promise<Whatsapp[]> => {
  const options: FindOptions = {
    where: {
      companyId
    },
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      }
    ]
  };

  if (queueId) {
    const queue = await Queue.findByPk(queueId, {
      include: [
        {
          model: Whatsapp,
          as: "whatsapps",
          attributes: ["id"]
        }
      ]
    });

    if (queue.whatsappId) {
      return [
        await Whatsapp.findByPk(queue.whatsappId, { include: options.include })
      ];
    }

    const restrictTransferConnection =
      (await GetCompanySetting(companyId, "restrictTransferConnection", "")) ===
      "enabled";

    if (queue.whatsapps.length && restrictTransferConnection) {
      options.where[Op.or] = [
        { "$queues.id$": queueId },
        { "$queues.id$": null }
      ];
      options.include[0].required = false;
    }
  }

  if (session !== undefined && session === 0) {
    options.attributes = { exclude: ["session"] };
  }

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListWhatsAppsService;
