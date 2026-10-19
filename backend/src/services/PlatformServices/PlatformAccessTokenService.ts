import { createHash, randomBytes } from "crypto";
import { addHours, addMinutes } from "date-fns";
import { Transaction } from "sequelize";
import Company from "../../models/Company";
import PlatformAccessToken from "../../models/PlatformAccessToken";
import User from "../../models/User";

export type PlatformAccessKind = "activation" | "sso";

export const hashPlatformAccessToken = (rawToken: string): string =>
  createHash("sha256").update(rawToken).digest("hex");

export const issuePlatformAccessToken = async (
  company: Company,
  user: User,
  kind: PlatformAccessKind,
  motivo: string,
  ator: string,
  transaction: Transaction
): Promise<{ rawToken: string; expiresAt: Date }> => {
  const rawToken = randomBytes(48).toString("base64url");
  const expiresAt =
    kind === "activation"
      ? addHours(new Date(), 24)
      : addMinutes(new Date(), 5);

  await PlatformAccessToken.create(
    {
      tokenHash: hashPlatformAccessToken(rawToken),
      companyId: company.id,
      userId: user.id,
      kind,
      motivo,
      ator,
      expiresAt
    } as unknown as PlatformAccessToken,
    { transaction }
  );

  return { rawToken, expiresAt };
};
