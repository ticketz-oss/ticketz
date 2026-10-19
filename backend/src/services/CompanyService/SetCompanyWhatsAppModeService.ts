import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import { assertCompanyCanUseMetaMode } from "../../helpers/EnsureCompanyChannelMode";

interface Request {
  companyId: number;
  whatsappMode: "normal" | "meta";
}

// Decisao de negocio: o modo (normal/meta) de uma empresa e travado uma unica
// vez e nunca revertido. Uma vez "meta", sempre "meta" - evita reconectar um
// numero que ja passou pela Cloud API de volta via Baileys (o proprio vetor
// de ban que motivou essa distincao) e evita misturar os dois modos.
const SetCompanyWhatsAppModeService = async ({
  companyId,
  whatsappMode
}: Request): Promise<Company> => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  if (company.whatsappMode === whatsappMode) {
    return company;
  }

  if (company.whatsappMode === "meta") {
    throw new AppError("ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE", 409);
  }

  if (whatsappMode === "meta") {
    await assertCompanyCanUseMetaMode(companyId);
  }

  await company.update({ whatsappMode });

  return company;
};

export default SetCompanyWhatsAppModeService;
