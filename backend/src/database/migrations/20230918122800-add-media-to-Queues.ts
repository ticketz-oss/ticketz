import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Queues", "mediaName", {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: true
    }),
    queryInterface.addColumn("Queues", "mediaPath", {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: true
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Queues", "mediaName"),
    queryInterface.removeColumn("Queues", "mediaPath");
  }
};
