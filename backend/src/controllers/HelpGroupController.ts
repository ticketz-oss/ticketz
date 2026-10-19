import { Request, Response } from "express";
import { isUndefined, omitBy } from "lodash";
import { getIO } from "../libs/socket";

import ListService from "../services/HelpGroupServices/ListService";
import CreateService from "../services/HelpGroupServices/CreateService";
import ShowService from "../services/HelpGroupServices/ShowService";
import UpdateService from "../services/HelpGroupServices/UpdateService";
import DeleteService from "../services/HelpGroupServices/DeleteService";
import ReorderService from "../services/HelpGroupServices/ReorderService";
import {
  actorFromRequest,
  assertManageableGroup
} from "../services/HelpGroupServices/scope";
import HelpGroup from "../models/HelpGroup";

type StoreData = {
  title: string;
  subtitle?: string;
  icon?: string;
  audience?: string;
  isGlobal?: boolean;
  isActive?: boolean;
  adminOnly?: boolean;
};

/**
 * Card da plataforma vai para todo mundo; card de empresa fica no canal dela,
 * senao o titulo de um tenant apareceria na tela dos outros.
 */
const notify = (
  action: string,
  group: { isGlobal: boolean; companyId: number },
  payload: Record<string, unknown>
): void => {
  const event = { action, ...payload };

  if (group.isGlobal) {
    getIO().emit("helpGroup", event);
    return;
  }

  getIO().to(`company-${group.companyId}-mainchannel`).emit("helpGroup", event);
};

// Carrega o card garantindo que o ator pode mexer nele: a rota exige admin, mas
// e aqui que a fronteira entre empresas e aplicada.
const findManageable = async (
  id: string | number,
  req: Request
): Promise<HelpGroup> => {
  const record = await ShowService(id);

  assertManageableGroup(record, actorFromRequest(req));

  return record;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const records = await ListService(actorFromRequest(req));

  return res.status(200).json(records);
};

// Campos que o cliente pode escrever. Montar o payload a mao em vez de espalhar
// req.body impede que um admin mande companyId/order e escape do proprio tenant.
// omitBy porque chave ausente e diferente de chave nula: no update so deve ir
// o que foi realmente enviado.
const pickFields = ({
  title,
  subtitle,
  icon,
  isActive,
  adminOnly
}: StoreData) =>
  omitBy(
    { title, subtitle, icon, isActive, adminOnly },
    isUndefined
  ) as Partial<StoreData>;

export const store = async (req: Request, res: Response): Promise<Response> => {
  const actor = actorFromRequest(req);
  const data = req.body as StoreData;

  const record = await CreateService({
    ...pickFields(data),
    title: data.title,
    companyId: actor.companyId,
    // Publicar para todas as empresas e criar material de parceiro sao
    // privilegios do super admin.
    isGlobal: actor.isSuper ? !!data.isGlobal : false,
    audience: actor.isSuper ? data.audience || "company" : "company"
  });

  notify("create", record, { record });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const record = await findManageable(req.params.id, req);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const actor = actorFromRequest(req);
  const current = await findManageable(req.params.id, req);
  const data = req.body as StoreData;

  const record = await UpdateService({
    ...pickFields(data),
    id: current.id,
    isGlobal: actor.isSuper ? !!data.isGlobal : current.isGlobal,
    audience: actor.isSuper
      ? data.audience || current.audience
      : current.audience
  });

  notify("update", record, { record });

  // Trocar o alcance tira o card da tela de quem via antes; sem avisar o escopo
  // anterior, aquelas abas ficariam com um card que nao existe mais para elas.
  if (current.isGlobal !== record.isGlobal) {
    notify("update", current, { record });
  }

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const record = await findManageable(req.params.id, req);
  const { isGlobal, companyId } = record;

  await DeleteService(record.id);

  notify("delete", { isGlobal, companyId }, { id: String(record.id) });

  return res.status(200).json({ message: "Help group deleted" });
};

export const reorder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const actor = actorFromRequest(req);

  const items = req.body?.items;

  const records = await ReorderService({ items, actor });

  // O reorder acontece dentro de um balde so, entao qualquer card movido ja diz
  // para quem o evento interessa. records vem da listagem inteira, nao so do
  // balde — por isso a busca pelo id enviado.
  const moved = records.find(
    record => String(record.id) === String(items?.[0]?.id)
  );

  if (moved) {
    notify("reorder", moved, { records });
  }

  return res.status(200).json(records);
};
