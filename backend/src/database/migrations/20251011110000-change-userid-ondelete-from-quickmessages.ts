import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.removeConstraint(
    "QuickMessages",
    "QuickMessages_userId_fkey"
  );

  await queryInterface.addConstraint("QuickMessages", {
    fields: ["userId"],
    type: "foreign key",
    name: "QuickMessages_userId_fkey",
    references: {
      table: "Users",
      field: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeConstraint(
    "QuickMessages",
    "QuickMessages_userId_fkey"
  );
  await queryInterface.addConstraint("QuickMessages", {
    fields: ["userId"],
    type: "foreign key",
    name: "QuickMessages_userId_fkey",
    references: {
      table: "Users",
      field: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  });
}
