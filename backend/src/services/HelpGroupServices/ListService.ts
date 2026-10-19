import HelpGroup from "../../models/HelpGroup";
import { HelpActor, manageableWhere } from "./scope";

/**
 * Grade de quem gerencia a Central de Ajuda: devolve todos os publicos.
 *
 * A listagem antiga de conteudos filtrava audience = "company", o que fazia um
 * tutorial de parceiro sumir da tela logo apos ser criado.
 *
 * O super ve tudo; o admin do tenant ve os cards da propria empresa mais os da
 * plataforma — estes aparecem so para leitura, para ele saber o que o
 * colaborador ja recebe.
 */
const ListService = async (actor: HelpActor): Promise<HelpGroup[]> => {
  const records: HelpGroup[] = await HelpGroup.findAll({
    where: manageableWhere(actor),
    order: [
      ["audience", "ASC"],
      ["isGlobal", "DESC"],
      ["order", "ASC"],
      ["id", "ASC"]
    ]
  });

  return records;
};

export default ListService;
