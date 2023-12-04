import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("QueueOptions", "mediaName", {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: true
    }),
    queryInterface.addColumn("QueueOptions", "mediaPath", {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: true
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("QueueOptions", "mediaName"),
    queryInterface.removeColumn("QueueOptions", "mediaPath");
  }
};
