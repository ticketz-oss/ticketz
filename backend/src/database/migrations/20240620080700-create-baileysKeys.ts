import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("BaileysKeys", {
      whatsappId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "Whatsapps", key: "id"},
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      },
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("BaileysKeys");
  }
};
