import { sign } from "jsonwebtoken";
import partnerAuthConfig from "../config/partnerAuth";
import Partner from "../models/Partner";

export const createPartnerAccessToken = (partner: Partner): string => {
  const { secret, expiresIn } = partnerAuthConfig;

  return sign(
    {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      partner: true
    },
    secret,
    { expiresIn }
  );
};

export const createPartnerRefreshToken = (partner: Partner): string => {
  const { refreshSecret, refreshExpiresIn } = partnerAuthConfig;

  return sign(
    {
      id: partner.id,
      tokenVersion: partner.tokenVersion,
      partner: true
    },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );
};
