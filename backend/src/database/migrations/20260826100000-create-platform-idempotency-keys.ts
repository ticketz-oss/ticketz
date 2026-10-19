import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("PlatformIdempotencyKeys", {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false, unique: true },
      method: { type: DataTypes.STRING, allowNull: false },
      path: { type: DataTypes.STRING, allowNull: false },
      bodyHash: { type: DataTypes.STRING(64), allowNull: false },
      statusCode: { type: DataTypes.INTEGER, allowNull: true },
      responseBody: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("PlatformIdempotencyKeys", ["createdAt"]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("PlatformIdempotencyKeys");
  }
};
