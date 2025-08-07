import { FindOptions, Op } from "sequelize";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";

interface Request {
  companyId: number;
  queueId?: number;
}

const ListWhatsAppsService = async ({
  queueId,
  companyId
}: Request): Promise<Whatsapp[]> => {
  const options: FindOptions = {
    attributes: [
      "id",
      "name",
      "channel",
      "status",
      "qrcode",
      "isDefault",
      "updatedAt"
    ],
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

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListWhatsAppsService;
