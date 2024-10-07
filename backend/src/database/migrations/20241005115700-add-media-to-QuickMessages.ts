import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QuickMessages", "mediaName", {
        type: DataTypes.TEXT,
        defaultValue: "",
        allowNull: true
      }),
      queryInterface.addColumn("QuickMessages", "mediaPath", {
        type: DataTypes.TEXT,
        defaultValue: "",
        allowNull: true
      })
    ]);
  },
  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QuickMessages", "mediaName"),
      queryInterface.removeColumn("QuickMessages", "mediaPath")
    ]);
  }
};
