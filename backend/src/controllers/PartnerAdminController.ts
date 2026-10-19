import { Request, Response } from "express";
import AppError from "../errors/AppError";
import PartnerPayout from "../models/PartnerPayout";
import {
  ListPartners,
  ShowPartner,
  CreatePartner,
  UpdatePartner,
  DeletePartner
} from "../services/PartnerServices/PartnerCrudService";
import GeneratePartnerInviteService from "../services/PartnerServices/GeneratePartnerInviteService";
import ListPartnerPayoutsService from "../services/PartnerServices/ListPartnerPayoutsService";
import SendPartnerPayoutsService from "../services/PartnerServices/SendPartnerPayoutsService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as Record<string, string>;

  const result = await ListPartners({ searchParam, pageNumber });

  return res.json(result);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const partner = await ShowPartner(req.params.id);

  return res.json(partner);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const partner = await CreatePartner(req.body);

  return res.status(200).json(partner);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const partner = await UpdatePartner(req.params.id, req.body);

  return res.json(partner);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await DeletePartner(req.params.id);

  return res.json({ message: "Partner deleted" });
};

/**
 * Gera o link de convite. Nao ha transporte de e-mail no projeto: o super
 * admin copia a URL e envia por WhatsApp ou e-mail manualmente.
 */
export const invite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { inviteToken, inviteTokenExpiresAt } =
    await GeneratePartnerInviteService(req.params.id);

  const base = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

  return res.json({
    token: inviteToken,
    expiresAt: inviteTokenExpiresAt,
    url: `${base}/parceiros/convite/${inviteToken}`
  });
};

export const payouts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { partnerId, startDate, endDate, status } = req.query as Record<
    string,
    string
  >;

  const result = await ListPartnerPayoutsService({
    partnerId: partnerId ? Number(partnerId) : undefined,
    startDate,
    endDate,
    status
  });

  return res.json(result);
};

/** Reenvio manual de um repasse que falhou. */
export const retryPayout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const payout = await PartnerPayout.findByPk(req.params.id);

  if (!payout) {
    throw new AppError("ERR_NO_PAYOUT_FOUND", 404);
  }

  if (payout.status === "paid" || payout.status === "processing") {
    throw new AppError("ERR_PAYOUT_NOT_RETRIABLE", 400);
  }

  // Zera o backoff e as tentativas para que o envio saia agora.
  await payout.update({ status: "pending", nextAttemptAt: null, attempts: 0 });

  await SendPartnerPayoutsService({ partnerId: payout.partnerId, force: true });

  await payout.reload();

  return res.json(payout);
};
