import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      // Remove duplicates, keeping the latest record based on createdAt
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ContactListItems"
        WHERE id NOT IN (
          SELECT MAX(id) AS id
          FROM "ContactListItems"
          GROUP BY "number", "contactListId"
        );
        `,
        { transaction }
      );

      // Add a composite unique index on number and contactListId
      await queryInterface.addIndex(
        "ContactListItems",
        ["number", "contactListId"],
        {
          unique: true,
          name: "unique_number_contactListId",
          transaction
        }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "ContactListItems",
      "unique_number_contactListId"
    );
  }
};
