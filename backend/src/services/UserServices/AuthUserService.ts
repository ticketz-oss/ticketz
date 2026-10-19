import { Sequelize, Op } from "sequelize";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import User from "../../models/User";
import AppError from "../../errors/AppError";
import normalizeSlug from "../../helpers/normalizeSlug";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import UpdateSettingService from "../SettingServices/UpdateSettingService";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  companyId: number;
}

interface Request {
  email: string;
  password: string;
  language?: string;
  // Slug do subdominio (tenant) sendo acessado. Quando presente e existente,
  // o login e' escopado a essa empresa: o mesmo email em empresas diferentes
  // resolve para o usuario DAQUELA empresa. Sem slug (apex/local), o login e'
  // restrito a empresa master configurada.
  slug?: string;
}

// Resolve o companyId a partir do slug do subdominio. Sem slug, usa somente a
// empresa master (dominio raiz/local). Com slug invalido/desconhecido, retorna
// -1 para nunca procurar o e-mail em empresas fora daquele tenant.
const resolveScopedCompanyId = async (slug?: string): Promise<number> => {
  if (!slug) {
    const configuredMasterId = Number(process.env.MASTER_COMPANY_ID || 1);
    return Number.isInteger(configuredMasterId) && configuredMasterId > 0
      ? configuredMasterId
      : -1;
  }

  let normalized = "";
  try {
    normalized = normalizeSlug(slug);
  } catch {
    return -1;
  }

  if (!normalized) {
    return -1;
  }

  const company = await Company.findOne({
    where: { slug: normalized },
    attributes: ["id"]
  });

  return company ? company.id : -1;
};

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const AuthUserService = async ({
  email,
  password,
  language,
  slug
}: Request): Promise<Response> => {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }
  const scopedCompanyId = await resolveScopedCompanyId(slug);
  assertRuntimeCompany(scopedCompanyId);

  const emailWhere = Sequelize.where(
    Sequelize.fn("LOWER", Sequelize.col("email")),
    email.toLowerCase()
  );

  // Com tenant resolvido pelo subdominio, restringe o usuario aquela empresa.
  // Assim o mesmo email pode existir em varias empresas e cada subdominio
  // autentica apenas o usuario da sua propria empresa.
  const where = { [Op.and]: [emailWhere, { companyId: scopedCompanyId }] };

  const user = await User.findOne({
    where,
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (user.company?.platformStatus === "suspenso") {
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  }

  if (!user.company?.status || user.company.platformStatus === "cancelado") {
    throw new AppError("ERR_COMPANY_INACTIVE", 403);
  }

  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (user.super && language) {
    if (!(await GetCompanySetting(1, "defaultLanguage", null))) {
      UpdateSettingService({
        key: "defaultLanguage",
        value: language,
        companyId: 1
      });
    }
  }

  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const serializedUser = await SerializeUser(user);

  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
