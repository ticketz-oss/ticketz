import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Whatsapps"
       DROP CONSTRAINT "whatsapps_active_baileys_session_owner_fk",
       ADD CONSTRAINT "whatsapps_active_baileys_session_owner_fk"
       FOREIGN KEY ("activeBaileysSessionId", "id")
       REFERENCES "BaileysSessions" ("id", "whatsappId")
       ON DELETE CASCADE`,
      { transaction }
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Whatsapps"
       DROP CONSTRAINT "whatsapps_active_baileys_session_owner_fk",
       ADD CONSTRAINT "whatsapps_active_baileys_session_owner_fk"
       FOREIGN KEY ("activeBaileysSessionId", "id")
       REFERENCES "BaileysSessions" ("id", "whatsappId")`,
      { transaction }
    );
  });
}
