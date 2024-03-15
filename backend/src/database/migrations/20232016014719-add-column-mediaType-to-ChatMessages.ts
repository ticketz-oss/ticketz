import { QueryInterface, DataTypes } from "sequelize";
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("ChatMessages", "mediaType", {
        type: DataTypes.TEXT,
        allowNull: true,
      }),
    ]);
  },
  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("ChatMessages", "mediaType"),
    ]);
  }
};
