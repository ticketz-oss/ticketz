import { FindOptions } from "sequelize";
import GetWhatsappConnectionNumber from "../../helpers/GetWhatsappConnectionNumber";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  companyId: number;
}

const ListWhatsAppsService = async ({
  companyId
}: Request): Promise<Array<Record<string, unknown>>> => {
  const options: FindOptions = {
    attributes: [
      "id",
      "name",
      "session",
      "channel",
      "status",
      "qrcode",
      "isDefault",
      "updatedAt",
      "apiMode",
      "metaHealthStatus",
      "metaPhoneNumberId"
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
    ],
    order: [["name", "ASC"]]
  };

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps.map(whatsapp => {
    const serialized = whatsapp.toJSON() as unknown as Record<string, unknown>;
    const { session, ...publicAttributes } = serialized;

    return {
      ...publicAttributes,
      number: GetWhatsappConnectionNumber(session)
    };
  });
};

export default ListWhatsAppsService;
