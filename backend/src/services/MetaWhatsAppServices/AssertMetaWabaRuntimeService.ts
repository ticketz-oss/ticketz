import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { runtimeOwnsCompany } from "../../helpers/tenantRuntime";

// A callback override belongs to the whole WABA, not an individual number.
// Never move an account already handled by another runtime (even disconnected).
const AssertMetaWabaRuntimeService = async (
  wabaId: string,
  whatsappId: number
): Promise<void> => {
  const connections = await Whatsapp.findAll({
    where: {
      metaWabaId: wabaId,
      apiMode: "official",
      id: { [Op.ne]: whatsappId }
    },
    attributes: ["id", "companyId"]
  });
  if (
    connections.some(connection => !runtimeOwnsCompany(connection.companyId))
  ) {
    throw new AppError("ERR_META_WABA_OTHER_RUNTIME", 409);
  }
};

export default AssertMetaWabaRuntimeService;
