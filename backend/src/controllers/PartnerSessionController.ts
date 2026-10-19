import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Partner from "../models/Partner";
import PartnerAuthService from "../services/PartnerServices/PartnerAuthService";
import { RefreshPartnerTokenService } from "../services/PartnerServices/RefreshPartnerTokenService";
import AcceptPartnerInviteService, {
  FindPartnerByInviteToken
} from "../services/PartnerServices/AcceptPartnerInviteService";
import { SendPartnerRefreshToken } from "../helpers/SendPartnerRefreshToken";
import SerializePartner from "../helpers/SerializePartner";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const { partner, token, refreshToken } = await PartnerAuthService({
    email,
    password
  });

  SendPartnerRefreshToken(res, refreshToken);

  return res.status(200).json({ token, partner });
};

export const refresh = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token = req.cookies.pjrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { partner, newToken, refreshToken } = await RefreshPartnerTokenService(
    res,
    token
  );

  SendPartnerRefreshToken(res, refreshToken);

  return res.json({ token: newToken, partner });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const partner = await Partner.findByPk(req.partner.id);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  return res.json(SerializePartner(partner));
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  res.clearCookie("pjrt");
  return res.send();
};

/** Tela publica de convite: valida o link antes de mostrar o formulario. */
export const showInvite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const partner = await FindPartnerByInviteToken(req.params.token);

  return res.json({ name: partner.name, email: partner.email });
};

export const acceptInvite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { password } = req.body;

  const partner = await AcceptPartnerInviteService(req.params.token, password);

  const { token, refreshToken } = await PartnerAuthService({
    email: partner.email,
    password
  });

  SendPartnerRefreshToken(res, refreshToken);

  return res.status(200).json({ token, partner: SerializePartner(partner) });
};
