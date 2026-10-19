import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "Contacts",
        "nameLocked",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      );

      // Existing names may already have been curated by an attendant. Preserve
      // them on rollout; new externally-created contacts start unlocked.
      await queryInterface.sequelize.query(
        `UPDATE "Contacts" SET "nameLocked" = true`,
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Contacts", "nameLocked");
  }
};
