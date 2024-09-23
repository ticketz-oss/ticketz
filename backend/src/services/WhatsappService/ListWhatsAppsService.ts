import { FindOptions } from "sequelize/types";
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
    const restrictTransferConnection =
      (await GetCompanySetting(companyId, "restrictTransferConnection", "")) ===
      "enabled";

    if (restrictTransferConnection) {
      options.include[0].where = { id: queueId };
      options.include[0].required = false;
    }
  }

  if (session !== undefined && session == 0) {
    options.attributes = { exclude: ["session"] };
  }

  const whatsapps = await Whatsapp.findAll(options);

  return whatsapps;
};

export default ListWhatsAppsService;
