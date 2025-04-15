import { Op, Transaction } from "sequelize";
import TicketTraking from "../../models/TicketTraking";
import sequelize from "../../database"; // Adjust the import to your Sequelize instance

interface Params {
  ticketId: number;
  companyId: number;
  whatsappId?: number;
  userId?: number;
  channel?: string;
}

const FindOrCreateATicketTrakingService = async ({
  ticketId,
  companyId,
  whatsappId,
  userId,
  channel
}: Params): Promise<TicketTraking> => {
  return sequelize.transaction(async (transaction: Transaction) => {
    const ticketTraking = await TicketTraking.findOne({
      where: {
        ticketId,
        finishedAt: {
          [Op.is]: null
        }
      },
      transaction
    });

    if (ticketTraking) {
      return ticketTraking;
    }

    const newRecord = await TicketTraking.create(
      {
        ticketId,
        companyId,
        whatsappId,
        userId
      },
      { transaction }
    );

    return newRecord;
  });
};

export default FindOrCreateATicketTrakingService;
