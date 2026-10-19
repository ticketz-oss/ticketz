import HelpGroup from "../../models/HelpGroup";
import Help from "../../models/Help";
import AppError from "../../errors/AppError";

interface Request {
  groupId: string | number;
  audience: string;
  companyId?: number;
  isAdmin?: boolean;
}

export interface PublicHelpGroupDetail {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  isGlobal: boolean;
  adminOnly: boolean;
  videos: Help[];
  articles: Help[];
}

/**
 * Conteudo de um card para o cliente ou para o parceiro.
 *
 * Fronteira de leitura: um grupo de outro publico ou de outra empresa responde
 * 404, e o que impede um usuario de ler material de parceiro ou do tenant
 * vizinho chutando o id na URL.
 */
const ShowPublicService = async ({
  groupId,
  audience,
  companyId,
  isAdmin = false
}: Request): Promise<PublicHelpGroupDetail> => {
  const group = await HelpGroup.findByPk(groupId);

  const visible =
    group &&
    group.isActive &&
    group.audience === audience &&
    (audience !== "company" || isAdmin || !group.adminOnly) &&
    (group.isGlobal || group.companyId === companyId);

  if (!visible) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  const contents = await Help.findAll({
    where: {
      groupId: group.id,
      isActive: true,
      ...(audience === "company" && !isAdmin ? { adminOnly: false } : {})
    },
    order: [
      ["order", "ASC"],
      ["id", "ASC"]
    ]
  });

  return {
    id: group.id,
    title: group.title,
    subtitle: group.subtitle,
    icon: group.icon,
    isGlobal: group.isGlobal,
    adminOnly: group.adminOnly,
    videos: contents.filter(content => content.type !== "article"),
    articles: contents.filter(content => content.type === "article")
  };
};

export default ShowPublicService;
