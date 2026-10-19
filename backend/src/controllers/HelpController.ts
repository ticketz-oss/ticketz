import * as Yup from "yup";
import { Request, Response } from "express";
import { isUndefined, omitBy } from "lodash";
import { getIO } from "../libs/socket";

import ListService from "../services/HelpServices/ListService";
import CreateService from "../services/HelpServices/CreateService";
import ShowService from "../services/HelpServices/ShowService";
import UpdateService from "../services/HelpServices/UpdateService";
import DeleteService from "../services/HelpServices/DeleteService";
import FindService from "../services/HelpServices/FindService";
import ReorderService from "../services/HelpServices/ReorderService";
import ShowPublicService from "../services/HelpGroupServices/ShowPublicService";
import HelpGroupShowService from "../services/HelpGroupServices/ShowService";
import {
  actorFromRequest,
  assertManageableGroup
} from "../services/HelpGroupServices/scope";
import sanitizeHelpContent from "../helpers/sanitizeHelpContent";
import parseYoutubeId from "../helpers/parseYoutubeId";
import HelpGroup from "../models/HelpGroup";

import AppError from "../errors/AppError";

type IndexQuery = {
  searchParam: string;
  groupId: string;
};

type StoreData = {
  groupId: number;
  title: string;
  description?: string;
  type?: string;
  // Anulaveis: trocar de video para artigo (ou o contrario) limpa o campo do
  // outro tipo, e "ausente" nao serve — o registro antigo ficaria pendurado.
  video?: string | null;
  content?: string | null;
  duration?: string;
  link?: string;
  isActive?: boolean;
  adminOnly?: boolean;
};

const CONTENT_TYPES = ["video", "article"];

/**
 * Conteudo da plataforma vai para todo mundo; conteudo de empresa fica no canal
 * dela. O escopo mora no card, entao o evento sai do grupo do conteudo.
 */
const notify = (
  action: string,
  group: { isGlobal: boolean; companyId: number },
  payload: Record<string, unknown>
): void => {
  const event = { action, ...payload };

  if (group.isGlobal) {
    getIO().emit("help", event);
    return;
  }

  getIO().to(`company-${group.companyId}-mainchannel`).emit("help", event);
};

// Carrega o card alvo garantindo que o ator pode publicar nele — impede o admin
// de pendurar conteudo num card da plataforma ou de outro tenant.
const findManageableGroup = async (
  groupId: string | number,
  req: Request
): Promise<HelpGroup> => {
  const group = await HelpGroupShowService(groupId);

  assertManageableGroup(group, actorFromRequest(req));

  return group;
};

// Campos que o cliente pode escrever: montar o payload a mao em vez de espalhar
// req.body impede injetar "order" e furar a sequencia do card.
const pickFields = ({
  title,
  description,
  duration,
  link,
  isActive,
  adminOnly
}: StoreData) =>
  omitBy(
    { title, description, duration, link, isActive, adminOnly },
    isUndefined
  ) as Partial<StoreData>;

const validate = async (data: StoreData): Promise<StoreData> => {
  const type = data.type || "video";

  if (!CONTENT_TYPES.includes(type)) {
    throw new AppError("ERR_HELP_INVALID_TYPE", 400);
  }

  const schema = Yup.object().shape({
    title: Yup.string().required("ERR_HELP_REQUIRED"),
    groupId: Yup.number()
      .integer("ERR_HELP_INVALID_GROUP")
      .required("ERR_HELP_GROUP_REQUIRED")
  });

  try {
    await schema.validate({ title: data.title, groupId: data.groupId });
  } catch (err) {
    throw new AppError(err.message);
  }

  if (type === "video" && !data.video && !data.link) {
    throw new AppError("ERR_HELP_VIDEO_REQUIRED", 400);
  }

  // O campo guarda o id do YouTube, mas colar a URL da barra de enderecos e o
  // gesto natural — normaliza aqui para o banco so ver o id.
  const video = type === "video" ? parseYoutubeId(data.video) : null;

  if (type === "video" && data.video && !video && !data.link) {
    throw new AppError("ERR_HELP_INVALID_VIDEO", 400);
  }

  const content = type === "article" ? sanitizeHelpContent(data.content) : null;

  if (type === "article" && !content.replace(/<[^>]*>/g, "").trim()) {
    throw new AppError("ERR_HELP_CONTENT_REQUIRED", 400);
  }

  return { ...data, type, video, content };
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, groupId } = req.query as IndexQuery;

  const records = await ListService({
    searchParam,
    groupId,
    actor: actorFromRequest(req)
  });

  return res.json(records);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = await validate(req.body as StoreData);

  const group = await findManageableGroup(data.groupId, req);

  const record = await CreateService({
    ...pickFields(data),
    title: data.title,
    groupId: group.id,
    type: data.type,
    video: data.video,
    content: data.content,
    adminOnly: group.audience === "company" ? !!data.adminOnly : false
  });

  notify("create", group, { record });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);

  await findManageableGroup(record.groupId, req);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await validate(req.body as StoreData);
  const { id } = req.params;

  const current = await ShowService(id);

  // Precisa poder mexer tanto no card de origem quanto no de destino, senao
  // seria possivel mover conteudo para fora (ou para dentro) do proprio tenant.
  const origin = await findManageableGroup(current.groupId, req);
  const group = await findManageableGroup(data.groupId, req);

  const record = await UpdateService({
    ...pickFields(data),
    id: current.id,
    groupId: group.id,
    type: data.type,
    video: data.video,
    content: data.content,
    adminOnly: group.audience === "company" ? !!data.adminOnly : false
  });

  notify("update", origin, { record });

  if (group.id !== origin.id) {
    notify("update", group, { record });
  }

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);
  const group = await findManageableGroup(record.groupId, req);

  await DeleteService(id);

  notify("delete", group, { id });

  return res.status(200).json({ message: "Help deleted" });
};

export const reorder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const records = await ReorderService({
    items: req.body?.items,
    actor: actorFromRequest(req)
  });

  const [first] = records;

  if (first) {
    // Todos os conteudos reordenados sao do mesmo card.
    const group = await HelpGroupShowService(first.groupId);

    notify("reorder", group, { records });
  }

  return res.status(200).json(records);
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const records = await FindService(
    req.user.companyId,
    req.user.profile === "admin"
  );

  return res.status(200).json(records);
};

export const showGroupContents = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const group = await ShowPublicService({
    groupId: req.params.id,
    audience: "company",
    companyId: req.user.companyId,
    isAdmin: req.user.profile === "admin"
  });

  return res.status(200).json(group);
};
