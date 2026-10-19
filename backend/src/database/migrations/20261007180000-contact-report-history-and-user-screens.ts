import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Users", "visibleScreens", {
      type: DataTypes.JSONB,
      allowNull: true
    });

    await queryInterface.createTable("ContactFieldHistories", {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      fieldId: { type: DataTypes.INTEGER, allowNull: false },
      contactId: { type: DataTypes.INTEGER, allowNull: false },
      companyId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.TEXT, allowNull: true },
      action: { type: DataTypes.STRING(10), allowNull: false },
      addedAt: { type: DataTypes.DATE, allowNull: false },
      changedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("ContactFieldHistories", [
      "companyId",
      "changedAt"
    ]);
    await queryInterface.addIndex("ContactFieldHistories", [
      "contactId",
      "fieldId",
      "changedAt"
    ]);

    await queryInterface.createTable("TicketNoteHistories", {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      noteId: { type: DataTypes.INTEGER, allowNull: false },
      ticketId: { type: DataTypes.INTEGER, allowNull: true },
      contactId: { type: DataTypes.INTEGER, allowNull: false },
      companyId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: false },
      action: { type: DataTypes.STRING(10), allowNull: false },
      addedAt: { type: DataTypes.DATE, allowNull: false },
      changedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("TicketNoteHistories", [
      "companyId",
      "changedAt"
    ]);
    await queryInterface.addIndex("TicketNoteHistories", [
      "contactId",
      "noteId",
      "changedAt"
    ]);

    // The current value is known from its last update onward. Older versions
    // cannot be reconstructed, so no value is invented before that timestamp.
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactFieldHistories" ("fieldId", "contactId", "companyId", "name", "value", "action", "addedAt", "changedAt")
      SELECT f.id, f."contactId", c."companyId", f.name, f.value, 'upsert', f."createdAt", f."updatedAt"
      FROM "ContactCustomFields" f JOIN "Contacts" c ON c.id = f."contactId";
      INSERT INTO "TicketNoteHistories" ("noteId", "ticketId", "contactId", "companyId", "userId", "note", "action", "addedAt", "changedAt")
      SELECT n.id, n."ticketId", n."contactId", c."companyId", n."userId", n.note, 'upsert', n."createdAt", n."updatedAt"
      FROM "TicketNotes" n JOIN "Contacts" c ON c.id = n."contactId";
    `);

    await queryInterface.sequelize.query(`
      CREATE FUNCTION audit_contact_field() RETURNS trigger AS $$
      DECLARE row_value record; tenant_id integer;
      BEGIN
        IF TG_OP = 'DELETE' THEN row_value := OLD; ELSE row_value := NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD."contactId" IS DISTINCT FROM NEW."contactId" THEN
          SELECT "companyId" INTO tenant_id FROM "Contacts" WHERE id = OLD."contactId";
          IF tenant_id IS NOT NULL THEN
            INSERT INTO "ContactFieldHistories" ("fieldId", "contactId", "companyId", "name", "value", "action", "addedAt", "changedAt")
            VALUES (OLD.id, OLD."contactId", tenant_id, OLD.name, OLD.value, 'delete', OLD."createdAt", NOW());
          END IF;
        END IF;
        SELECT "companyId" INTO tenant_id FROM "Contacts" WHERE id = row_value."contactId";
        IF tenant_id IS NOT NULL AND (TG_OP <> 'UPDATE' OR OLD.name IS DISTINCT FROM NEW.name OR OLD.value IS DISTINCT FROM NEW.value OR OLD."contactId" IS DISTINCT FROM NEW."contactId") THEN
          INSERT INTO "ContactFieldHistories" ("fieldId", "contactId", "companyId", "name", "value", "action", "addedAt", "changedAt")
          VALUES (row_value.id, row_value."contactId", tenant_id, row_value.name, row_value.value, CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END, row_value."createdAt", NOW());
        END IF;
        RETURN row_value;
      END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER contact_field_audit AFTER INSERT OR UPDATE OR DELETE ON "ContactCustomFields"
        FOR EACH ROW EXECUTE FUNCTION audit_contact_field();
      CREATE FUNCTION audit_ticket_note() RETURNS trigger AS $$
      DECLARE row_value record; tenant_id integer;
      BEGIN
        IF TG_OP = 'DELETE' THEN row_value := OLD; ELSE row_value := NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD."contactId" IS DISTINCT FROM NEW."contactId" THEN
          SELECT "companyId" INTO tenant_id FROM "Contacts" WHERE id = OLD."contactId";
          IF tenant_id IS NOT NULL THEN
            INSERT INTO "TicketNoteHistories" ("noteId", "ticketId", "contactId", "companyId", "userId", "note", "action", "addedAt", "changedAt")
            VALUES (OLD.id, OLD."ticketId", OLD."contactId", tenant_id, OLD."userId", OLD.note, 'delete', OLD."createdAt", NOW());
          END IF;
        END IF;
        SELECT "companyId" INTO tenant_id FROM "Contacts" WHERE id = row_value."contactId";
        IF tenant_id IS NOT NULL AND (TG_OP <> 'UPDATE' OR OLD.note IS DISTINCT FROM NEW.note OR OLD."contactId" IS DISTINCT FROM NEW."contactId") THEN
          INSERT INTO "TicketNoteHistories" ("noteId", "ticketId", "contactId", "companyId", "userId", "note", "action", "addedAt", "changedAt")
          VALUES (row_value.id, row_value."ticketId", row_value."contactId", tenant_id, row_value."userId", row_value.note, CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END, row_value."createdAt", NOW());
        END IF;
        RETURN row_value;
      END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER ticket_note_audit AFTER INSERT OR UPDATE OR DELETE ON "TicketNotes"
        FOR EACH ROW EXECUTE FUNCTION audit_ticket_note();
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS ticket_note_audit ON "TicketNotes";
      DROP FUNCTION IF EXISTS audit_ticket_note();
      DROP TRIGGER IF EXISTS contact_field_audit ON "ContactCustomFields";
      DROP FUNCTION IF EXISTS audit_contact_field();
    `);
    await queryInterface.dropTable("TicketNoteHistories");
    await queryInterface.dropTable("ContactFieldHistories");
    await queryInterface.removeColumn("Users", "visibleScreens");
  }
};
