import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "Companies",
        "signupSource",
        {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: "admin"
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Companies",
        "trialStartedAt",
        {
          type: DataTypes.DATE,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Companies",
        "trialExpiresAt",
        {
          type: DataTypes.DATE,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.sequelize.query(
        'UPDATE "Companies" SET "signupSource" = \'partner\' WHERE "partnerId" IS NOT NULL',
        { transaction }
      );
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn("Companies", "trialExpiresAt", {
        transaction
      });
      await queryInterface.removeColumn("Companies", "trialStartedAt", {
        transaction
      });
      await queryInterface.removeColumn("Companies", "signupSource", {
        transaction
      });
    });
  }
};
