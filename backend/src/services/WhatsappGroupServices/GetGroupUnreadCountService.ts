import { QueryTypes } from "sequelize";
import sequelize from "../../database";

const GetGroupUnreadCountService = async (
  userId: number,
  companyId: number,
  profile: string
): Promise<number> => {
  const accessCondition =
    profile === "admin"
      ? ""
      : `
        AND EXISTS (
          SELECT 1
          FROM "GroupQueues" group_queue
          INNER JOIN "UserQueues" user_queue
            ON user_queue."queueId" = group_queue."queueId"
          WHERE group_queue."groupContactId" = ticket."contactId"
            AND group_queue."companyId" = :companyId
            AND user_queue."userId" = :userId
        )
      `;

  const [result] = await sequelize.query<{ count: number }>(
    `
      SELECT COALESCE(SUM(read_state."unreadCount"), 0)::integer AS count
      FROM "GroupReadStates" read_state
      INNER JOIN "Tickets" ticket ON ticket.id = read_state."ticketId"
      INNER JOIN "Contacts" contact ON contact.id = ticket."contactId"
      WHERE read_state."userId" = :userId
        AND read_state."companyId" = :companyId
        AND ticket."companyId" = :companyId
        AND ticket."isGroup" = true
        AND contact."isGroup" = true
        AND contact."groupMode" = 'conversation'
        ${accessCondition}
    `,
    {
      replacements: { userId, companyId },
      type: QueryTypes.SELECT
    }
  );

  return Number(result?.count || 0);
};

export default GetGroupUnreadCountService;
