import { Response as Res } from "express";
import { verify } from "jsonwebtoken";

import Partner from "../../models/Partner";
import AppError from "../../errors/AppError";
import partnerAuthConfig from "../../config/partnerAuth";
import {
  createPartnerAccessToken,
  createPartnerRefreshToken
} from "../../helpers/CreatePartnerTokens";
import {
  SerializePartner,
  SerializedPartner
} from "../../helpers/SerializePartner";

interface PartnerRefreshPayload {
  id: number;
  tokenVersion: number;
  partner: boolean;
}

interface Response {
  partner: SerializedPartner;
  newToken: string;
  refreshToken: string;
}

export const RefreshPartnerTokenService = async (
  res: Res,
  token: string
): Promise<Response> => {
  try {
    const decoded = verify(
      token,
      partnerAuthConfig.refreshSecret
    ) as PartnerRefreshPayload;

    const partner = await Partner.findByPk(decoded.id);

    if (!partner || !partner.status) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    // Troca de senha invalida as sessoes anteriores.
    if (partner.tokenVersion !== decoded.tokenVersion) {
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    return {
      partner: SerializePartner(partner),
      newToken: createPartnerAccessToken(partner),
      refreshToken: createPartnerRefreshToken(partner)
    };
  } catch {
    res.clearCookie("pjrt");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
};

export default RefreshPartnerTokenService;
