import { Op, Transaction } from "sequelize";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  queue: Queue;
  whatsappIds?: number[];
  companyId: number;
  transaction?: Transaction;
}

const normalizeIds = (ids: number[]): number[] =>
  Array.from(
    new Set(ids.map(Number).filter(id => Number.isInteger(id) && id > 0))
  );

const AssociateQueueWhatsapp = async ({
  queue,
  whatsappIds,
  companyId,
  transaction
}: Request): Promise<void> => {
  // Omissão mantém o comportamento dos clientes antigos: não altera vínculos.
  if (whatsappIds === undefined) return;

  if (!Array.isArray(whatsappIds)) {
    throw new AppError("ERR_QUEUE_INVALID_CONNECTION", 400);
  }

  const normalizedIds = normalizeIds(whatsappIds);

  if (normalizedIds.length !== whatsappIds.length) {
    throw new AppError("ERR_QUEUE_INVALID_CONNECTION", 400);
  }

  if (normalizedIds.length > 0) {
    const connectionsCount = await Whatsapp.count({
      where: {
        id: { [Op.in]: normalizedIds },
        companyId
      },
      transaction
    });

    if (connectionsCount !== normalizedIds.length) {
      throw new AppError("ERR_QUEUE_INVALID_CONNECTION", 400);
    }
  }

  await queue.$set("whatsapps", normalizedIds, { transaction });
};

export default AssociateQueueWhatsapp;
