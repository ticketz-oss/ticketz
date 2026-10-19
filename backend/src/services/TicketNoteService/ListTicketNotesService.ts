import { Sequelize, Op } from "sequelize";
import TicketNote from "../../models/TicketNote";
import Ticket from "../../models/Ticket";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface Response {
  ticketNotes: TicketNote[];
  count: number;
  hasMore: boolean;
}

const ListTicketNotesService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    [Op.or]: [
      {
        note: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("note")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: ticketNotes } = await TicketNote.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: Ticket,
        as: "ticket",
        where: { companyId },
        required: true,
        attributes: ["id", "status", "createdAt"]
      }
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + ticketNotes.length;

  return {
    ticketNotes,
    count,
    hasMore
  };
};

export default ListTicketNotesService;
