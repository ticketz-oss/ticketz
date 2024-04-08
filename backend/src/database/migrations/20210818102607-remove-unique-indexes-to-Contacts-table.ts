import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint("Contacts","number_companyid_unique" )

  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addConstraint("Contacts", { fields: ["number", "companyId"],
      type: "unique",
      name: "number_companyid_unique"
    });
  }
};
