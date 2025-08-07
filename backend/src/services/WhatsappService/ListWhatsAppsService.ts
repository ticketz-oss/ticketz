import { FindOptions } from "sequelize/types";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  companyId: number;
}

const ListWhatsAppsService = async ({
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

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListWhatsAppsService;
