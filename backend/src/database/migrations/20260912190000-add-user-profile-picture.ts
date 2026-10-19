import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) =>
    queryInterface.addColumn("Users", "profilePicUrl", {
      type: DataTypes.STRING,
      allowNull: true
    }),
  down: (queryInterface: QueryInterface) =>
    queryInterface.removeColumn("Users", "profilePicUrl")
};
