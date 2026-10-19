import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "profileHiresPictureUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "profileHiresPictureUrl");
  }
};
