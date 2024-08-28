import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Messages", "thumbnailUrl", {
        type: DataTypes.STRING,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Messages", "thumbnailUrl")
    ]);
  }
};
