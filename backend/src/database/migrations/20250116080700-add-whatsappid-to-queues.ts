import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Queues", "whatsappId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      references: {
        model: "Whatsapps",
        key: "id"
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Queues", "whatsappId");
  }
};
