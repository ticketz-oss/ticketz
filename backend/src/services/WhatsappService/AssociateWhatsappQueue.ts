import Whatsapp from "../../models/Whatsapp";
import Queue from "../../models/Queue";
import AppError from "../../errors/AppError";
import { Op } from "sequelize";

const AssociateWhatsappQueue = async (
  whatsapp: Whatsapp,
  queueIds: number[]
): Promise<void> => {
  if (!Array.isArray(queueIds)) {
    throw new AppError("ERR_WAPP_INVALID_QUEUE", 400);
  }

  const normalizedIds = Array.from(
    new Set(queueIds.map(Number).filter(id => Number.isInteger(id) && id > 0))
  );

  if (normalizedIds.length !== queueIds.length) {
    throw new AppError("ERR_WAPP_INVALID_QUEUE", 400);
  }

  if (normalizedIds.length > 0) {
    const queueCount = await Queue.count({
      where: {
        id: { [Op.in]: normalizedIds },
        companyId: whatsapp.companyId
      }
    });

    if (queueCount !== normalizedIds.length) {
      throw new AppError("ERR_WAPP_INVALID_QUEUE", 400);
    }
  }

  await whatsapp.$set("queues", normalizedIds);

  await whatsapp.reload();
};

export default AssociateWhatsappQueue;
