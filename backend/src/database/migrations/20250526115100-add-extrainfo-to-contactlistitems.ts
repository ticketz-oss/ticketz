import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ContactListItems", "extraInfo", {
      type: DataTypes.JSONB,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("ContactListItems", "extraInfo");
  }
};
