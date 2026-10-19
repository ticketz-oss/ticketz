import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("PushSubscriptions", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      // O endpoint é a identidade da inscrição para o push service. O mesmo
      // usuário tem uma inscrição por dispositivo/navegador, e reinstalar o
      // PWA gera um endpoint novo, por isso a chave única é o endpoint e não
      // o par (userId, dispositivo).
      endpoint: { type: DataTypes.TEXT, allowNull: false },
      p256dh: { type: DataTypes.TEXT, allowNull: false },
      auth: { type: DataTypes.TEXT, allowNull: false },
      userAgent: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    // Postgres não indexa TEXT ilimitado em índice único btree sem risco de
    // estouro de página, mas endpoints de push ficam bem abaixo do limite de
    // 2704 bytes; o hash do md5 evitaria a colisão de tamanho ao custo de não
    // poder usar ON CONFLICT no upsert, então mantemos o índice direto.
    await queryInterface.addIndex("PushSubscriptions", ["endpoint"], {
      unique: true,
      name: "push_subscriptions_endpoint_unique"
    });

    // O envio busca as inscrições dos destinatários resolvidos a cada mensagem.
    await queryInterface.addIndex(
      "PushSubscriptions",
      ["companyId", "userId"],
      {
        name: "push_subscriptions_company_user"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("PushSubscriptions");
  }
};
