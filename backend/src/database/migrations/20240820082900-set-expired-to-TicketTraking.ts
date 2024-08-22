import { QueryInterface, Op } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkUpdate(
      "TicketTraking",
      { expired: true },
      {
        rated: false,
        ratingAt: { [Op.not]: null }
      }
    );
  },

  down: () => {
    return Promise.resolve(true);
  }
};
