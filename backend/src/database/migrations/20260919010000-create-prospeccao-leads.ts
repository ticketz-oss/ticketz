import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ProspeccaoLeads", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      jobId: { type: DataTypes.STRING, allowNull: false },
      // Id do lead no hermes-bridge: é o que torna a ingestão idempotente
      // enquanto a tela faz poll do mesmo job.
      externalId: { type: DataTypes.INTEGER, allowNull: false },
      nome: { type: DataTypes.STRING, allowNull: true },
      // Só dígitos com DDI: é a chave de deduplicação entre buscas.
      telefone: { type: DataTypes.STRING, allowNull: true },
      telefoneExibicao: { type: DataTypes.STRING, allowNull: true },
      categoria: { type: DataTypes.STRING, allowNull: true },
      endereco: { type: DataTypes.TEXT, allowNull: true },
      instagramHandle: { type: DataTypes.STRING, allowNull: true },
      instagramBio: { type: DataTypes.TEXT, allowNull: true },
      instagramSeguidores: { type: DataTypes.INTEGER, allowNull: true },
      idiomaSugerido: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pendente"
      },
      rascunho: { type: DataTypes.TEXT, allowNull: true },
      erro: { type: DataTypes.TEXT, allowNull: true },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      ticketId: {
        type: DataTypes.INTEGER,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      abertoEm: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex(
      "ProspeccaoLeads",
      ["companyId", "externalId"],
      {
        unique: true,
        name: "prospeccao_leads_company_external_unique"
      }
    );

    // A deduplicação entre buscas consulta por telefone a cada lead ingerido.
    await queryInterface.addIndex(
      "ProspeccaoLeads",
      ["companyId", "telefone"],
      {
        name: "prospeccao_leads_company_telefone"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ProspeccaoLeads");
  }
};
