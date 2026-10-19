import { Sequelize, Op, Transaction } from "sequelize";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import normalizeSlug from "../../helpers/normalizeSlug";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Company from "../../models/Company";
import PlatformAccessToken from "../../models/PlatformAccessToken";
import Setting from "../../models/Setting";
import User from "../../models/User";
import {
  hashPlatformAccessToken,
  issuePlatformAccessToken
} from "../PlatformServices/PlatformAccessTokenService";

const assertCompanyActive = (company: Company): void => {
  assertRuntimeCompany(company.id);
  if (company.platformStatus === "suspenso") {
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  }
  if (!company.status || company.platformStatus === "cancelado") {
    throw new AppError("ERR_COMPANY_INACTIVE", 403);
  }
};

const resolveTenant = async (slug: unknown): Promise<Company | null> => {
  if (typeof slug !== "string" || !slug.trim()) {
    const configuredMasterId = Number(process.env.MASTER_COMPANY_ID || 1);
    return Number.isInteger(configuredMasterId) && configuredMasterId > 0
      ? Company.findByPk(configuredMasterId)
      : null;
  }

  let normalized: string;
  try {
    normalized = normalizeSlug(slug);
  } catch {
    return null;
  }

  if (!normalized) return null;
  return Company.findOne({ where: { slug: normalized } });
};

const findScopedUser = async (
  companyId: number,
  email: unknown
): Promise<User | null> => {
  if (typeof email !== "string" || !email.trim().includes("@")) return null;

  const emailWhere = Sequelize.where(
    Sequelize.fn("LOWER", Sequelize.col("email")),
    email.trim().toLowerCase()
  );

  return User.findOne({
    where: { [Op.and]: [emailWhere, { companyId }] }
  });
};

export const identifyLogin = async (
  email: unknown,
  slug: unknown
): Promise<Record<string, unknown>> => {
  const company = await resolveTenant(slug);
  if (!company) throw new AppError("ERR_EMAIL_NOT_FOUND", 404);

  const user = await findScopedUser(company.id, email);
  if (!user) throw new AppError("ERR_EMAIL_NOT_FOUND", 404);

  assertCompanyActive(company);

  if (user.passwordConfigured) {
    return {
      email_existe: true,
      senha_definida: true,
      proxima_etapa: "senha"
    };
  }

  const activation = await sequelize.transaction(transaction =>
    issuePlatformAccessToken(
      company,
      user,
      "activation",
      "login_sem_senha",
      "usuario",
      transaction
    )
  );

  return {
    email_existe: true,
    senha_definida: false,
    proxima_etapa: "criar_senha",
    ativacao_token: activation.rawToken
  };
};

const findActivation = async (
  rawToken: unknown,
  transaction?: Transaction,
  lock = false
): Promise<PlatformAccessToken> => {
  if (typeof rawToken !== "string" || rawToken.length < 48) {
    throw new AppError("ERR_ACTIVATION_INVALID", 401);
  }

  const activation = await PlatformAccessToken.findOne({
    where: { tokenHash: hashPlatformAccessToken(rawToken) },
    transaction,
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {})
  });

  if (
    !activation ||
    activation.kind !== "activation" ||
    activation.usedAt ||
    activation.expiresAt.getTime() < Date.now()
  ) {
    throw new AppError("ERR_ACTIVATION_INVALID", 401);
  }

  return activation;
};

export const inspectActivation = async (
  rawToken: unknown
): Promise<Record<string, unknown>> => {
  const activation = await findActivation(rawToken);
  const [company, user] = await Promise.all([
    Company.findByPk(activation.companyId),
    User.findByPk(activation.userId)
  ]);

  if (!company || !user) throw new AppError("ERR_ACTIVATION_INVALID", 401);
  assertCompanyActive(company);
  if (user.passwordConfigured) {
    throw new AppError("ERR_PASSWORD_ALREADY_CONFIGURED", 409);
  }

  return { email: user.email, tenant_id: String(company.id) };
};

const validatePassword = (
  password: unknown,
  passwordConfirmation: unknown
): string => {
  if (password !== passwordConfirmation) {
    throw new AppError("ERR_PASSWORD_CONFIRMATION", 422);
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new AppError("ERR_PASSWORD_TOO_WEAK", 422);
  }
  return password;
};

export const setupInitialPassword = async (
  rawToken: unknown,
  passwordValue: unknown,
  passwordConfirmation: unknown
): Promise<{
  token: string;
  refreshToken: string;
  serializedUser: Record<string, unknown>;
}> => {
  const password = validatePassword(passwordValue, passwordConfirmation);
  let userId = 0;

  await sequelize.transaction(async transaction => {
    const activation = await findActivation(rawToken, transaction, true);
    const company = await Company.findByPk(activation.companyId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const user = await User.findByPk(activation.userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!company || !user) throw new AppError("ERR_ACTIVATION_INVALID", 401);
    assertCompanyActive(company);
    if (user.passwordConfigured) {
      throw new AppError("ERR_PASSWORD_ALREADY_CONFIGURED", 409);
    }

    await user.update({ password, passwordConfigured: true }, { transaction });
    await PlatformAccessToken.update(
      { usedAt: new Date() },
      {
        where: { userId: user.id, kind: "activation", usedAt: null },
        transaction
      }
    );
    userId = user.id;
  });

  const user = await User.findByPk(userId, {
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });
  if (!user) throw new AppError("ERR_ACTIVATION_INVALID", 401);

  return {
    token: createAccessToken(user),
    refreshToken: createRefreshToken(user),
    serializedUser: (await SerializeUser(user)) as unknown as Record<
      string,
      unknown
    >
  };
};
