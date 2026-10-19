import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Fail safely on pre-existing duplicate mappings instead of arbitrarily
    // routing an inbound message to the wrong tenant.
    await queryInterface.addIndex("Whatsapps", ["metaPhoneNumberId"], {
      unique: true,
      name: "whatsapps_meta_phone_number_unique"
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Whatsapps",
      "whatsapps_meta_phone_number_unique"
    );
  }
};
