import { QueryInterface } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS unaccent")
    ]);
  },

  down: _ => {
    return Promise.resolve();
  }
};
