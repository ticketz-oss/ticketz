import { Op, WhereOptions } from "sequelize";
import HelpGroup from "../../models/HelpGroup";
import AppError from "../../errors/AppError";

/**
 * Regras de escopo da Central de Ajuda em dois niveis.
 *
 * O super admin publica material da plataforma (isGlobal), visivel para todas
 * as empresas. O admin de cada empresa publica material proprio, visivel so
 * para os colaboradores dela. Concentrar a decisao aqui evita que cada
 * controller/service reinvente a checagem — e esqueca uma.
 */
export interface HelpActor {
  companyId: number;
  isSuper: boolean;
}

export const actorFromRequest = (req: {
  user: { companyId: number; isSuper: boolean };
}): HelpActor => ({
  companyId: req.user.companyId,
  isSuper: req.user.isSuper
});

/**
 * Super manda em tudo. O admin so mexe no que e da propria empresa — nunca no
 * material da plataforma nem no de parceiros.
 */
export const canManageGroup = (group: HelpGroup, actor: HelpActor): boolean =>
  actor.isSuper ||
  (!group.isGlobal &&
    group.audience === "company" &&
    group.companyId === actor.companyId);

export const assertManageableGroup = (
  group: HelpGroup,
  actor: HelpActor
): void => {
  if (!canManageGroup(group, actor)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

/**
 * Cards que aparecem no painel de gestao: os da propria empresa mais os globais
 * (estes em modo leitura, para o admin saber que existem).
 *
 * Vale tambem para o super: o material privado de um tenant nao interessa ao
 * dono da plataforma, e sem nome de empresa na tela a lista viraria uma pilha
 * ilegivel de cards de terceiros. O super continua podendo editar qualquer card
 * pelo id (canManageGroup nao restringe) — so nao os lista.
 */
export const manageableWhere = (actor: HelpActor): WhereOptions => ({
  [Op.or]: [{ isGlobal: true }, { companyId: actor.companyId }]
});

/**
 * Balde de um card: publico + escopo. Cards de parceiro sao sempre globais.
 */
export interface HelpGroupScope {
  audience: string;
  isGlobal: boolean;
  companyId: number;
}

/**
 * Cada lista da tela tem a propria sequencia 0..N-1, entao reordenar so faz
 * sentido dentro de um mesmo balde.
 */
export const scopeKey = (group: HelpGroupScope): string =>
  `${group.audience}:${group.isGlobal ? "global" : group.companyId}`;

/**
 * Filtro que define o balde, usado para calcular o "order" de entrada sem que
 * dois tenants briguem pela mesma posicao.
 */
export const scopeWhere = (group: HelpGroupScope): WhereOptions =>
  group.isGlobal
    ? { audience: group.audience, isGlobal: true }
    : {
        audience: group.audience,
        isGlobal: false,
        companyId: group.companyId
      };
