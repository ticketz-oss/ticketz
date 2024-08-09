import { Op } from "sequelize";
import Company from "../../models/Company";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";

const TicketzStatusService = async (): Promise<any> => {

  const companies = await Company.count({
    where: {
      dueDate: {
        [Op.gt]: new Date()
      }
    }
  });

  const connections = await Whatsapp.count({
    where: {
      status: "CONNECTED"
    }
  });

  const agents = await User.count({
    where: {
      online: true
    }
  });

  return { companies, connections, agents };
};

export default TicketzStatusService;
