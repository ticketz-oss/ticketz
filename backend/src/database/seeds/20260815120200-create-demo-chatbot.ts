import { QueryInterface, QueryTypes } from "sequelize";

// Automacao de demonstracao para a empresa de testes (slug/nome "teste").
// Exercita todos os recursos do chatbot: ramificacao de tres niveis, saida do
// chatbot, transferencia para outra fila e opcao desativada.
//
// E um no-op silencioso quando a empresa nao existe, quando a demo ja foi
// criada ou quando os nomes/cores colidem com filas existentes -- entao roda
// sem efeito nas outras instalacoes.

const MAIN_QUEUE = {
  name: "Atendimento (demo)",
  color: "#00A884",
  greetingMessage:
    "Olá! 👋 Você chegou ao atendimento de demonstração.\n\nEscolha uma opção digitando o número correspondente:",
  outOfHoursMessage:
    "Estamos fora do horário de atendimento no momento. Deixe sua mensagem que retornamos assim que possível."
};

const FORWARD_QUEUE = {
  name: "Financeiro (demo)",
  color: "#6C5CE7",
  greetingMessage:
    "Você foi transferido para o Financeiro (demo). Um atendente vai continuar por aqui.",
  outOfHoursMessage: ""
};

type OptionSeed = {
  title: string;
  message: string;
  isActive?: boolean;
  exitChatbot?: boolean;
  forwardToQueue?: boolean;
  children?: OptionSeed[];
};

const TREE: OptionSeed[] = [
  {
    title: "Vendas",
    message: "Ótimo! O que você precisa em Vendas?",
    children: [
      {
        title: "Orçamento",
        message:
          "Me conte em uma mensagem o que você precisa e eu preparo um orçamento."
      },
      {
        title: "Falar com um consultor",
        message:
          "Certo, vou te encaminhar para um consultor. Aguarde um instante. 🙂",
        exitChatbot: true
      }
    ]
  },
  {
    title: "Suporte",
    message: "Sem problema. Qual é o tipo de suporte?",
    children: [
      {
        title: "Problema técnico",
        message: "Onde o problema está acontecendo?",
        children: [
          {
            title: "Internet",
            message:
              "Tente reiniciar o roteador e aguardar 2 minutos. Se continuar, digite # para voltar."
          },
          {
            title: "Sistema",
            message:
              "Descreva a tela em que o erro aparece e, se possível, envie um print."
          }
        ]
      }
    ]
  },
  {
    title: "Financeiro",
    message: "Vou te transferir para o time financeiro.",
    forwardToQueue: true
  },
  {
    title: "Pesquisa de satisfação",
    message:
      "Esta opção está desativada de propósito: ela não aparece no menu e não responde se o cliente digitar o número dela.",
    isActive: false
  }
];

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const { sequelize } = queryInterface;

    const [company] = await sequelize.query<{ id: number }>(
      `SELECT id FROM "Companies"
       WHERE lower(coalesce(slug, '')) = 'teste' OR lower(name) = 'teste'
       ORDER BY id LIMIT 1`,
      { type: QueryTypes.SELECT }
    );

    if (!company) return;

    const companyId = company.id;
    const names = [MAIN_QUEUE.name, FORWARD_QUEUE.name];
    const colors = [MAIN_QUEUE.color, FORWARD_QUEUE.color];

    // "name" e "color" sao unicos por empresa: se qualquer um ja estiver em uso
    // (inclusive por uma execucao anterior desta seed) nao ha o que fazer.
    const conflicts = await sequelize.query<{ id: number }>(
      `SELECT id FROM "Queues"
       WHERE "companyId" = :companyId AND (name IN (:names) OR color IN (:colors))
       LIMIT 1`,
      { type: QueryTypes.SELECT, replacements: { companyId, names, colors } }
    );

    if (conflicts.length) return;

    const [{ count }] = await sequelize.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "Queues" WHERE "companyId" = :companyId`,
      { type: QueryTypes.SELECT, replacements: { companyId } }
    );

    let queueOrder = Number(count);

    const insertQueue = async (queue: typeof MAIN_QUEUE): Promise<number> => {
      const [row] = await sequelize.query<{ id: number }>(
        `INSERT INTO "Queues"
           ("name", "color", "greetingMessage", "outOfHoursMessage",
            "order", "companyId", "createdAt", "updatedAt")
         VALUES (:name, :color, :greetingMessage, :outOfHoursMessage,
                 :order, :companyId, NOW(), NOW())
         RETURNING id`,
        {
          type: QueryTypes.SELECT,
          replacements: { ...queue, order: (queueOrder += 1) - 1, companyId }
        }
      );
      return row.id;
    };

    const mainQueueId = await insertQueue(MAIN_QUEUE);
    const forwardQueueId = await insertQueue(FORWARD_QUEUE);

    // "option" e a tecla digitada pelo cliente: 1..N contando apenas as ativas,
    // exatamente como o RenumberSiblingsService calcularia.
    const insertLevel = async (
      options: OptionSeed[],
      parentId: number | null
    ): Promise<void> => {
      let key = 0;

      // eslint-disable-next-line no-restricted-syntax
      for (const [index, seed] of options.entries()) {
        const isActive = seed.isActive !== false;

        const [row] = await sequelize.query<{ id: number }>(
          `INSERT INTO "QueueOptions"
             ("title", "message", "option", "order", "isActive", "queueId",
              "parentId", "forwardQueueId", "exitChatbot", "createdAt", "updatedAt")
           VALUES (:title, :message, :option, :order, :isActive, :queueId,
                   :parentId, :forwardQueueId, :exitChatbot, NOW(), NOW())
           RETURNING id`,
          {
            type: QueryTypes.SELECT,
            replacements: {
              title: seed.title,
              message: seed.message,
              option: isActive ? String((key += 1)) : null,
              order: index,
              isActive,
              queueId: mainQueueId,
              parentId,
              forwardQueueId: seed.forwardToQueue ? forwardQueueId : null,
              exitChatbot: !!seed.exitChatbot
            }
          }
        );

        if (seed.children?.length) {
          await insertLevel(seed.children, row.id);
        }
      }
    };

    await insertLevel(TREE, null);
  },

  down: async (queryInterface: QueryInterface) => {
    const { sequelize } = queryInterface;

    // As opcoes saem primeiro para nao esbarrar na FK de "forwardQueueId".
    await sequelize.query(
      `DELETE FROM "QueueOptions"
       WHERE "queueId" IN (SELECT id FROM "Queues" WHERE name IN (:names))`,
      { replacements: { names: [MAIN_QUEUE.name, FORWARD_QUEUE.name] } }
    );

    await sequelize.query(`DELETE FROM "Queues" WHERE name IN (:names)`, {
      replacements: { names: [MAIN_QUEUE.name, FORWARD_QUEUE.name] }
    });
  }
};
