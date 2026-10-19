import Setting from "../../models/Setting";
import Company from "../../models/Company";
import normalizeSlug from "../../helpers/normalizeSlug";
import { getMasterCompanyId } from "../../helpers/masterCompany";

interface Request {
  key: string;
  slug?: string;
}

const publicSettingsKeys = [
  "allowSignup",
  "primaryColorLight",
  "primaryColorDark",
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "appName",
  "loginPageLinks",
  "loginSidePanelImage",
  "loginBackgroundContent",
  "loginHeadline",
  "loginDescription",
  "loginTemplate",
  "linkPreviewImage",
  "linkPreviewDescription",
  "vapidPublicKey",
  "extensionDownloadUrl"
];

// Resolve o companyId a partir do slug (subdominio). Slug valido e existente
// -> empresa do slug. Caso contrario -> empresa master configurada, ou null
// (marca generica) para nunca expor um cliente por padrao.
const resolveCompanyId = async (slug?: string): Promise<number | null> => {
  let normalized = "";
  try {
    normalized = normalizeSlug(slug);
  } catch {
    return getMasterCompanyId();
  }

  if (normalized) {
    const company = await Company.findOne({
      where: { slug: normalized },
      attributes: ["id"]
    });

    if (company) {
      return company.id;
    }
  }

  return getMasterCompanyId();
};

const GetPublicSettingService = async ({
  key,
  slug
}: Request): Promise<string | undefined> => {
  if (!publicSettingsKeys.includes(key)) {
    return null;
  }

  const companyId = await resolveCompanyId(slug);

  // Sem empresa resolvida -> marca generica (frontend usa os defaults).
  if (!companyId) {
    return null;
  }

  const setting = await Setting.findOne({
    where: {
      companyId,
      key
    }
  });

  return setting?.value || null;
};

export default GetPublicSettingService;
