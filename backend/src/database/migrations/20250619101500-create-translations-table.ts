import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Translations", {
      language: {
        type: DataTypes.STRING,
        allowNull: false
      },
      namespace: {
        type: DataTypes.STRING,
        allowNull: false
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    });

    // Composite primary index
    await queryInterface.addIndex(
      "Translations",
      ["language", "namespace", "key"],
      {
        unique: true,
        name: "composite_language_namespace_key"
      }
    );

    // Additional indexes for individual fields
    await queryInterface.addIndex("Translations", ["language"], {
      name: "index_language"
    });
    await queryInterface.addIndex("Translations", ["namespace"], {
      name: "index_namespace"
    });
    await queryInterface.addIndex("Translations", ["key"], {
      name: "index_key"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Translations");
  }
};
