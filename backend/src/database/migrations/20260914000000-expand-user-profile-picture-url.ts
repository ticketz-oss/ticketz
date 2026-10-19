import { QueryInterface, DataTypes } from "sequelize";

// Clerk image proxy URLs can exceed varchar(255). Widening preserves all values.
module.exports = {
  up: (queryInterface: QueryInterface) =>
    queryInterface.changeColumn("Users", "profilePicUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    }),
  // Keep TEXT on rollback: shrinking could truncate existing provider URLs.
  down: async () => {}
};
