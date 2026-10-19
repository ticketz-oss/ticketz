import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Companies", "platformStatus", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "ativo"
    });
    await queryInterface.addColumn("Companies", "platformBilling", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "sistema"
    });
    await queryInterface.addColumn("Companies", "platformPartnerRef", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Companies", "platformLimits", {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn("Companies", "platformCancelledAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Companies", "platformDataUntil", {
      type: DataTypes.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn("Invoices", "externalRef", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "origem", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "sistema"
    });
    await queryInterface.addColumn("Invoices", "competencia", {
      type: DataTypes.STRING(7),
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "ciclo", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "forma", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "linkPagamento", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "paidAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Invoices", "platformOverdueNotifiedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addIndex("Invoices", ["companyId", "externalRef"], {
      unique: true,
      name: "invoices_company_external_ref_unique"
    });
    await queryInterface.addIndex("Invoices", ["origem", "status", "dueDate"], {
      name: "invoices_platform_status_due_idx"
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex(
      "Invoices",
      "invoices_platform_status_due_idx"
    );
    await queryInterface.removeIndex(
      "Invoices",
      "invoices_company_external_ref_unique"
    );
    await queryInterface.removeColumn("Invoices", "platformOverdueNotifiedAt");
    await queryInterface.removeColumn("Invoices", "paidAt");
    await queryInterface.removeColumn("Invoices", "linkPagamento");
    await queryInterface.removeColumn("Invoices", "forma");
    await queryInterface.removeColumn("Invoices", "ciclo");
    await queryInterface.removeColumn("Invoices", "competencia");
    await queryInterface.removeColumn("Invoices", "origem");
    await queryInterface.removeColumn("Invoices", "externalRef");
    await queryInterface.removeColumn("Companies", "platformDataUntil");
    await queryInterface.removeColumn("Companies", "platformCancelledAt");
    await queryInterface.removeColumn("Companies", "platformLimits");
    await queryInterface.removeColumn("Companies", "platformPartnerRef");
    await queryInterface.removeColumn("Companies", "platformBilling");
    await queryInterface.removeColumn("Companies", "platformStatus");
  }
};
