import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.sequelize.transaction(async transaction => {
    let hasBaileysContactsTable = true;

    try {
      await queryInterface.describeTable("BaileysContacts");
    } catch {
      hasBaileysContactsTable = false;
    }

    if (!hasBaileysContactsTable) {
      await queryInterface.createTable(
        "BaileysContacts",
        {
          whatsappId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: { model: "Whatsapps", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          contactId: {
            type: DataTypes.TEXT,
            primaryKey: true,
            allowNull: false
          },
          payload: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
          }
        },
        { transaction }
      );
    }

    try {
      await queryInterface.addIndex("BaileysContacts", ["whatsappId"], {
        name: "idx_baileys_contacts_whatsappid",
        transaction
      });
    } catch (error) {
      const errorMessage = String(error?.message || error);
      if (!errorMessage.includes("already exists")) {
        throw error;
      }
    }

    await queryInterface.sequelize.query(
      `
      CREATE OR REPLACE FUNCTION erpcon_safe_jsonb_baileyscontacts_20260312(input_text TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        normalized_text TEXT;
        parsed_json JSONB;
      BEGIN
        normalized_text := btrim(input_text);

        IF input_text IS NULL OR normalized_text = '' THEN
          RETURN '[]'::jsonb;
        END IF;

        parsed_json := normalized_text::jsonb;

        IF jsonb_typeof(parsed_json) <> 'array' THEN
          RETURN '[]'::jsonb;
        END IF;

        RETURN parsed_json;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN '[]'::jsonb;
      END;
      $$;
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      WITH extracted AS (
        SELECT
          b."whatsappId" AS "whatsappId",
          elem->>'id' AS "contactId",
          elem AS "payload",
          COALESCE(b."createdAt", NOW()) AS "createdAt",
          COALESCE(b."updatedAt", NOW()) AS "updatedAt"
        FROM "Baileys" b
        INNER JOIN "Whatsapps" w ON w."id" = b."whatsappId"
        CROSS JOIN LATERAL jsonb_array_elements(
          erpcon_safe_jsonb_baileyscontacts_20260312(b."contacts")
        ) elem
        WHERE NULLIF(elem->>'id', '') IS NOT NULL
      ),
      deduped AS (
        SELECT DISTINCT ON ("whatsappId", "contactId")
          "whatsappId",
          "contactId",
          "payload",
          "createdAt",
          "updatedAt"
        FROM extracted
        ORDER BY "whatsappId", "contactId", "updatedAt" DESC
      )
      INSERT INTO "BaileysContacts" (
        "whatsappId",
        "contactId",
        "payload",
        "createdAt",
        "updatedAt"
      )
      SELECT
        d."whatsappId",
        d."contactId",
        d."payload",
        d."createdAt",
        d."updatedAt"
      FROM deduped d
      ON CONFLICT ("whatsappId", "contactId")
      DO UPDATE SET
        "payload" = EXCLUDED."payload",
        "updatedAt" = EXCLUDED."updatedAt";
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      DROP FUNCTION IF EXISTS erpcon_safe_jsonb_baileyscontacts_20260312(TEXT);
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      DELETE FROM "Baileys";
    `,
      { transaction }
    );
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.sequelize.transaction(async transaction => {
    await queryInterface.sequelize.query(
      `
      WITH aggregated AS (
        SELECT
          bc."whatsappId" AS "whatsappId",
          jsonb_agg(bc."payload" ORDER BY bc."contactId") AS "contactsJson",
          MIN(bc."createdAt") AS "minCreatedAt",
          MAX(bc."updatedAt") AS "maxUpdatedAt"
        FROM "BaileysContacts" bc
        GROUP BY bc."whatsappId"
      )
      UPDATE "Baileys" b
      SET
        "contacts" = aggregated."contactsJson"::text,
        "updatedAt" = GREATEST(b."updatedAt", aggregated."maxUpdatedAt")
      FROM aggregated
      WHERE b."whatsappId" = aggregated."whatsappId";
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      INSERT INTO "Baileys" (
        "whatsappId",
        "contacts",
        "chats",
        "createdAt",
        "updatedAt"
      )
      SELECT
        aggregated."whatsappId",
        aggregated."contactsJson"::text,
        NULL,
        COALESCE(aggregated."minCreatedAt", NOW()),
        COALESCE(aggregated."maxUpdatedAt", NOW())
      FROM (
        SELECT
          bc."whatsappId" AS "whatsappId",
          jsonb_agg(bc."payload" ORDER BY bc."contactId") AS "contactsJson",
          MIN(bc."createdAt") AS "minCreatedAt",
          MAX(bc."updatedAt") AS "maxUpdatedAt"
        FROM "BaileysContacts" bc
        GROUP BY bc."whatsappId"
      ) aggregated
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Baileys" b
        WHERE b."whatsappId" = aggregated."whatsappId"
      );
    `,
      { transaction }
    );

    await queryInterface.dropTable("BaileysContacts", { transaction });
  });
}
