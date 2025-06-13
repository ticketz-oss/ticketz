import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("WhatsappLidMaps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Contacts",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex("WhatsappLidMaps", ["lid"]);
    await queryInterface.addIndex("WhatsappLidMaps", ["companyId"]);
    await queryInterface.addConstraint("WhatsappLidMaps", {
      fields: ["lid", "companyId"],
      type: "unique",
      name: "unique_lid_companyId"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("WhatsappLidMaps");
  }
};
