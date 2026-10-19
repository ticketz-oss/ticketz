import { createClerkClient, verifyToken } from "@clerk/backend";
import { Op, Sequelize } from "sequelize";
import { getClerkConfig } from "../../config/clerk";
import { assertRuntimeCompany } from "../../helpers/tenantRuntime";
import AppError from "../../errors/AppError";
import normalizeSlug from "../../helpers/normalizeSlug";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import User from "../../models/User";

const invalid = () => new AppError("ERR_SOCIAL_LOGIN_INVALID", 401);
const noAccess = () => new AppError("ERR_SOCIAL_LOGIN_NO_ACCESS", 403);

export const safeGoogleAvatar = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length > 4096) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password)
      return undefined;
    // Only remote Google/Clerk images; no download or backend proxy request.
    if (
      url.hostname !== "img.clerk.com" &&
      url.hostname !== "images.clerk.dev" &&
      !url.hostname.endsWith(".googleusercontent.com")
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
};

const resolveCompany = async (slug: unknown): Promise<Company | null> => {
  if (slug === undefined || slug === null || slug === "") {
    const masterId = Number(process.env.MASTER_COMPANY_ID || 1);
    return Number.isSafeInteger(masterId) && masterId > 0
      ? Company.findByPk(masterId)
      : null;
  }
  if (typeof slug !== "string") return null;
  try {
    const normalized = normalizeSlug(slug);
    if (!normalized) return null;
    return Company.findOne({ where: { slug: normalized } });
  } catch {
    return null;
  }
};

export default async function ClerkGoogleAuthService({
  clerkToken,
  slug,
  requestOrigin
}: {
  clerkToken: unknown;
  slug?: unknown;
  requestOrigin: string | undefined;
}) {
  const config = getClerkConfig();
  if (!config.enabled) throw new AppError("ERR_SOCIAL_LOGIN_DISABLED", 503);
  if (
    typeof clerkToken !== "string" ||
    !clerkToken ||
    clerkToken.length > 16000
  )
    throw invalid();

  let identity: { email: string; name: string; avatar?: string };
  let trustedSlug: string;
  try {
    const claims = await verifyToken(clerkToken, {
      secretKey: config.secretKey,
      authorizedParties: config.authorizedParties
    });
    if (
      claims.iss !== config.issuer ||
      !claims.sub ||
      !claims.sid ||
      !claims.azp ||
      claims.sts === "pending" ||
      requestOrigin !== claims.azp ||
      !config.authorizedParties.includes(claims.azp)
    )
      throw invalid();
    const hostname = new URL(claims.azp).hostname;
    const requestedSlug = typeof slug === "string" ? normalizeSlug(slug) : "";
    if (slug !== undefined && slug !== null && typeof slug !== "string")
      throw invalid();
    if (
      config.environment === "development" &&
      ["localhost", "127.0.0.1"].includes(hostname)
    ) {
      trustedSlug = requestedSlug;
    } else if (
      [
        config.tenantBaseDomain,
        `www.${config.tenantBaseDomain}`,
        `app.${config.tenantBaseDomain}`
      ].includes(hostname)
    ) {
      trustedSlug = "";
    } else if (hostname.endsWith(`.${config.tenantBaseDomain}`)) {
      trustedSlug = normalizeSlug(
        hostname.slice(0, -(config.tenantBaseDomain.length + 1))
      );
    } else {
      throw invalid();
    }
    if (requestedSlug !== trustedSlug) throw invalid();
    const client = createClerkClient({ secretKey: config.secretKey });
    const [session, clerkUser] = await Promise.all([
      client.sessions.getSession(claims.sid),
      client.users.getUser(claims.sub)
    ]);
    if (
      session.status !== "active" ||
      session.userId !== claims.sub ||
      clerkUser.id !== claims.sub ||
      clerkUser.banned ||
      clerkUser.locked
    )
      throw invalid();

    // The primary email must be verified AND attached to this Google account.
    // A different verified email added to the Clerk profile never grants access.
    const email = clerkUser.emailAddresses.find(
      item =>
        item.id === clerkUser.primaryEmailAddressId &&
        item.verification?.status === "verified"
    );
    const google = clerkUser.externalAccounts.find(
      account =>
        ["google", "oauth_google"].includes(account.provider) &&
        account.verification?.status === "verified" &&
        account.emailAddress?.toLowerCase() ===
          email?.emailAddress.toLowerCase() &&
        email?.linkedTo.some(
          link =>
            [account.id, account.identificationId].includes(link.id) &&
            link.type === "oauth_google"
        )
    );
    if (!email || !google) throw invalid();
    identity = {
      email: email.emailAddress.trim().toLowerCase(),
      name: [google.firstName, google.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
        .slice(0, 255),
      avatar: safeGoogleAvatar(google.imageUrl)
    };
  } catch {
    // Never log JWTs or provider responses (which may contain personal data).
    throw invalid();
  }

  const company = await resolveCompany(trustedSlug);
  if (!company) throw noAccess();
  assertRuntimeCompany(company.id);
  if (company.platformStatus === "suspenso")
    throw new AppError("ERR_COMPANY_SUSPENDED", 403);
  if (!company.status || company.platformStatus === "cancelado")
    throw new AppError("ERR_COMPANY_INACTIVE", 403);

  const user = await User.findOne({
    where: {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.email")),
          identity.email
        ),
        { companyId: company.id }
      ]
    },
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });
  if (!user || user.companyId !== company.id) throw noAccess();
  // Preserve email, privileges, password, tokenVersion and all channel sessions.
  const profile: { name?: string; profilePicUrl?: string } = {};
  if (identity.name) profile.name = identity.name;
  if (identity.avatar) profile.profilePicUrl = identity.avatar;
  if (Object.keys(profile).length) await user.update(profile);
  return {
    token: createAccessToken(user),
    refreshToken: createRefreshToken(user),
    serializedUser: await SerializeUser(user)
  };
}
