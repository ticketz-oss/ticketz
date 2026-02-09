import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.sequelize.transaction(async transaction => {
    // Clean up orphaned rows
    await queryInterface.bulkDelete(
      "Queues",
      { companyId: null },
      { transaction }
    );
    await queryInterface.bulkDelete(
      "Contacts",
      { companyId: null },
      { transaction }
    );
    await queryInterface.bulkDelete(
      "Tickets",
      { companyId: null },
      { transaction }
    );

    // Set companyId to NOT NULL
    await queryInterface.changeColumn(
      "Queues",
      "companyId",
      {
        type: "INTEGER",
        allowNull: false
      },
      { transaction }
    );
    await queryInterface.changeColumn(
      "Contacts",
      "companyId",
      {
        type: "INTEGER",
        allowNull: false
      },
      { transaction }
    );
    await queryInterface.changeColumn(
      "Tickets",
      "companyId",
      {
        type: "INTEGER",
        allowNull: false
      },
      { transaction }
    );

    // Remove old constraints
    await queryInterface.removeConstraint("Queues", "Queues_companyId_fkey", {
      transaction
    });
    await queryInterface.removeConstraint(
      "Contacts",
      "Contacts_companyId_fkey",
      { transaction }
    );
    await queryInterface.removeConstraint("Tickets", "Tickets_companyId_fkey", {
      transaction
    });

    // Add new constraints with CASCADE
    await queryInterface.addConstraint("Queues", {
      fields: ["companyId"],
      type: "foreign key",
      name: "Queues_companyId_fkey",
      references: {
        table: "Companies",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      transaction
    });

    await queryInterface.addConstraint("Contacts", {
      fields: ["companyId"],
      type: "foreign key",
      name: "Contacts_companyId_fkey",
      references: {
        table: "Companies",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      transaction
    });

    await queryInterface.addConstraint("Tickets", {
      fields: ["companyId"],
      type: "foreign key",
      name: "Tickets_companyId_fkey",
      references: {
        table: "Companies",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      transaction
    });
  });
}

export async function down() {
  // no op
}
