import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("PartnerPayouts", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      partnerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Partners", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Invoices", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      baseValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      commissionPct: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      feeAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      netAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      mode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "immediate"
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending"
      },
      batchId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      txId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      failReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      nextAttemptAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Invariante critica do sistema: uma fatura gera no maximo uma comissao.
    // Um replay do webhook de pagamento nao consegue duplicar o repasse.
    await queryInterface.addIndex("PartnerPayouts", ["invoiceId"], {
      unique: true,
      name: "partner_payouts_invoice_unique"
    });

    await queryInterface.addIndex("PartnerPayouts", ["partnerId", "status"], {
      name: "partner_payouts_partner_status_idx"
    });

    await queryInterface.addIndex("PartnerPayouts", ["batchId"], {
      name: "partner_payouts_batch_idx"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("PartnerPayouts");
  }
};
