import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("TicketTraking", "chatbotendAt", {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp indicating when the chatbot interaction ended"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("TicketTraking", "chatbotendAt");
  }
};
