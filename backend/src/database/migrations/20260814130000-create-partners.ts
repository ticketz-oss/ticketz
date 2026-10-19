import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Partners", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true
      },
      tokenVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      commissionPct: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      pixKey: {
        type: DataTypes.STRING,
        allowNull: true
      },
      pixKeyType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      payoutMode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "immediate"
      },
      payoutDay: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      inviteToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      inviteTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.addIndex("Partners", ["inviteToken"], {
      name: "partners_invite_token_idx"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("Partners");
  }
};
