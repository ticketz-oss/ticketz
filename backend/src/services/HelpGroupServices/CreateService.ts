import * as Yup from "yup";
import AppError from "../../errors/AppError";
import HelpGroup from "../../models/HelpGroup";
import { scopeWhere } from "./scope";

interface Data {
  title: string;
  subtitle?: string;
  icon?: string;
  audience?: string;
  companyId: number;
  isGlobal?: boolean;
  isActive?: boolean;
  adminOnly?: boolean;
}

const CreateService = async (data: Data): Promise<HelpGroup> => {
  const schema = Yup.object().shape({
    title: Yup.string()
      .min(3, "ERR_HELP_GROUP_INVALID_TITLE")
      .required("ERR_HELP_GROUP_INVALID_TITLE"),
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

  const audience = data.audience || "company";

  // O portal do parceiro autentica sem companyId, entao material de parceiro
  // nao tem empresa a que pertencer: e sempre da plataforma.
  const isGlobal = audience === "partner" ? true : !!data.isGlobal;

  // Entra no fim da lista do proprio balde (publico + escopo) — se a contagem
  // fosse global, dois tenants brigariam pela mesma posicao.
  const maxOrder = (await HelpGroup.max("order", {
    where: scopeWhere({ audience, isGlobal, companyId: data.companyId })
  })) as number | null;

  const record = await HelpGroup.create({
    ...data,
    audience,
    isGlobal,
    adminOnly: audience === "company" ? !!data.adminOnly : false,
    order: Number.isInteger(maxOrder) ? maxOrder + 1 : 0
  } as HelpGroup);

  return record;
};

export default CreateService;
