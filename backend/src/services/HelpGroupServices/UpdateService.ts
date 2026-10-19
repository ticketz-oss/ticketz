import * as Yup from "yup";
import AppError from "../../errors/AppError";
import HelpGroup from "../../models/HelpGroup";
import { scopeKey, scopeWhere } from "./scope";

interface Data {
  id: number;
  title?: string;
  subtitle?: string;
  icon?: string;
  audience?: string;
  isGlobal?: boolean;
  isActive?: boolean;
  adminOnly?: boolean;
}

const UpdateService = async (data: Data): Promise<HelpGroup> => {
  const { id } = data;

  const record = await HelpGroup.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_HELP_GROUP_FOUND", 404);
  }

  const schema = Yup.object().shape({
    title: Yup.string().min(3, "ERR_HELP_GROUP_INVALID_TITLE"),
    audience: Yup.string().oneOf(
      ["company", "partner"],
      "ERR_HELP_GROUP_INVALID_AUDIENCE"
    )
  });

  try {
    await schema.validate({ title: data.title, audience: data.audience });
  } catch (err) {
    throw new AppError(err.message);
  }

  const audience = data.audience || record.audience;
  // Material de parceiro e sempre da plataforma (o portal autentica sem
  // companyId, entao nao ha empresa a que pertencer).
  const isGlobal =
    audience === "partner" ? true : (data.isGlobal ?? record.isGlobal);
  const adminOnly =
    audience === "company" ? (data.adminOnly ?? record.adminOnly) : false;

  const target = { audience, isGlobal, companyId: record.companyId };

  // Trocar de publico ou de escopo move o card para o fim da lista de destino,
  // senao ele herdaria uma posicao ja ocupada la.
  if (scopeKey(target) !== scopeKey(record)) {
    const maxOrder = (await HelpGroup.max("order", {
      where: scopeWhere(target)
    })) as number | null;

    await record.update({
      ...data,
      audience,
      isGlobal,
      adminOnly,
      order: Number.isInteger(maxOrder) ? maxOrder + 1 : 0
    });

    return record;
  }

  await record.update({ ...data, audience, isGlobal, adminOnly });

  return record;
};

export default UpdateService;
