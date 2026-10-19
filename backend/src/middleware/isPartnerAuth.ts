import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import partnerAuthConfig from "../config/partnerAuth";
import Partner from "../models/Partner";

interface PartnerTokenPayload {
  id: number;
  name: string;
  email: string;
  partner: boolean;
  iat: number;
  exp: number;
}

/**
 * Autentica um parceiro. Nunca preenche `req.user`/`req.companyId`: um
 * parceiro nao pertence a nenhum tenant e nao deve satisfazer nenhum
 * middleware de tenant que porventura venha depois na cadeia.
 */
const isPartnerAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_UNAUTHORIZED", 401, "debug");
  }

  const [, token] = authHeader.split(" ");

  let tokenData: PartnerTokenPayload;

  try {
    tokenData = verify(token, partnerAuthConfig.secret) as PartnerTokenPayload;
  } catch (err) {
    throw new AppError("ERR_SESSION_EXPIRED", 403, "debug");
  }

  // Confere o estado atual: um parceiro desativado perde o acesso na hora,
  // sem esperar o token expirar.
  const partner = await Partner.findByPk(tokenData.id, {
    attributes: ["id", "name", "email", "status"]
  });

  if (!partner || !partner.status) {
    throw new AppError("ERR_UNAUTHORIZED", 401, "debug");
  }

  req.partner = {
    id: partner.id,
    name: partner.name,
    email: partner.email
  };

  return next();
};

export default isPartnerAuth;
