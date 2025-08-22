import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Wavoips", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Whatsapps",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("Wavoips");
  }
};
