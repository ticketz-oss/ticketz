import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Users", {
      fields: [
        queryInterface.sequelize.fn(
          "LOWER",
          queryInterface.sequelize.col("email")
        )
      ],
      name: "idx_lower_email"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Users", "idx_lower_email");
  }
};
