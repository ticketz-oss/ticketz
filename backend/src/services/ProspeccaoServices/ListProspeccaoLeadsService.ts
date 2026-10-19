import { Op, Sequelize, WhereOptions } from "sequelize";
import ProspeccaoLead from "../../models/ProspeccaoLead";

const POR_PAGINA_VALIDOS = [10, 25, 50, 100];

interface Request {
  companyId: number;
  filtro?: string;
  searchParam?: string;
  pageNumber?: string | number;
  perPage?: string | number;
}

interface Response {
  leads: ProspeccaoLead[];
  contatados: Set<number>;
  count: number;
  hasMore: boolean;
  pageNumber: number;
  perPage: number;
}

// "Já mandei mensagem" não é um booleano que a tela marca: é a existência de
// uma mensagem nossa para aquele contato. Assim o filtro continua verdadeiro
// mesmo quando a conversa acontece fora da tela de prospecção.
const SQL_TEM_MENSAGEM = `EXISTS (
  SELECT 1 FROM "Messages" m
  WHERE m."contactId" = "ProspeccaoLead"."contactId"
    AND m."fromMe" = true
    AND m."companyId" = "ProspeccaoLead"."companyId"
)`;

export const normalizaPaginacao = (
  pageNumber?: string | number,
  perPage?: string | number
): { pagina: number; porPagina: number } => {
  const pagina = Math.max(1, Number(pageNumber) || 1);
  const pedido = Number(perPage) || 10;
  const porPagina = POR_PAGINA_VALIDOS.includes(pedido) ? pedido : 10;
  return { pagina, porPagina };
};

const ListProspeccaoLeadsService = async ({
  companyId,
  filtro,
  searchParam,
  pageNumber,
  perPage
}: Request): Promise<Response> => {
  const { pagina, porPagina } = normalizaPaginacao(pageNumber, perPage);

  const condicoes: WhereOptions[] = [{ companyId }];

  if (filtro === "contatados") {
    condicoes.push(
      Sequelize.literal(SQL_TEM_MENSAGEM) as unknown as WhereOptions
    );
  } else if (filtro === "nao_contatados") {
    condicoes.push(
      Sequelize.literal(`NOT ${SQL_TEM_MENSAGEM}`) as unknown as WhereOptions
    );
    condicoes.push({
      [Op.or]: [{ deliveryStatus: null }, { deliveryStatus: "NOT_CONTACTED" }]
    } as WhereOptions);
  } else if (filtro === "conversa_aberta") {
    condicoes.push({
      ticketId: { [Op.ne]: null },
      [Op.or]: [
        { deliveryStatus: null },
        { deliveryStatus: "OPEN_CONVERSATION" }
      ]
    } as WhereOptions);
    condicoes.push(
      Sequelize.literal(`NOT ${SQL_TEM_MENSAGEM}`) as unknown as WhereOptions
    );
  } else if (filtro === "agendados") {
    condicoes.push({ deliveryStatus: { [Op.in]: ["QUEUED", "SENDING"] } });
  } else if (filtro === "pausados") {
    condicoes.push({ deliveryStatus: "PAUSED" });
  } else if (filtro === "respondidos") {
    condicoes.push({ deliveryStatus: "REPLIED" });
  } else if (filtro === "falhas") {
    condicoes.push({ deliveryStatus: "FAILED" });
  } else if (filtro === "fechados") {
    condicoes.push({ deliveryStatus: "CLOSED_NO_REPLY" });
  }

  const busca = String(searchParam || "").trim();
  if (busca) {
    condicoes.push({
      [Op.or]: [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { categoria: { [Op.iLike]: `%${busca}%` } },
        { instagramHandle: { [Op.iLike]: `%${busca}%` } }
      ]
    } as WhereOptions);
  }

  const { count, rows } = await ProspeccaoLead.findAndCountAll({
    where: { [Op.and]: condicoes },
    limit: porPagina,
    offset: porPagina * (pagina - 1),
    order: [["createdAt", "DESC"]]
  });

  // Uma consulta por página resolve o estado de contato de todos os leads
  // listados, em vez de repetir o EXISTS na serialização de cada linha.
  const contactIds = rows
    .map(lead => lead.contactId)
    .filter((id): id is number => !!id);

  let contatados = new Set<number>();
  if (contactIds.length) {
    const linhas = await ProspeccaoLead.sequelize!.query<{
      contactId: number;
    }>(
      `SELECT DISTINCT m."contactId" AS "contactId"
         FROM "Messages" m
        WHERE m."fromMe" = true
          AND m."companyId" = :companyId
          AND m."contactId" IN (:contactIds)`,
      {
        replacements: { contactIds, companyId },
        type: "SELECT" as never
      }
    );
    contatados = new Set(linhas.map(linha => linha.contactId));
  }

  return {
    leads: rows,
    contatados,
    count,
    hasMore: count > porPagina * pagina,
    pageNumber: pagina,
    perPage: porPagina
  };
};

export default ListProspeccaoLeadsService;
