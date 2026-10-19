import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addIndex(
      "BaileysKeys",
      ["whatsappId", "type", "key"],
      {
        name: "idx_baileyskeys_whatsappid_type_key"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeIndex(
      "BaileysKeys",
      "idx_baileyskeys_whatsappid_type_key"
    );
  }
};
