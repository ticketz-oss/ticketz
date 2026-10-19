import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Partner from "../../models/Partner";
import PartnerPayout from "../../models/PartnerPayout";
import {
  PIX_KEY_TYPES,
  getPartnerPixFee
} from "../PaymentGatewayServices/AbacatePayServices";
import { round2 } from "./AccrualPartnerPayoutService";

interface SettingsData {
  pixKey?: string;
  pixKeyType?: string;
  payoutMode?: string;
  payoutDay?: number | null;
}

// 28 e o ultimo dia que existe em todos os meses.
const MAX_PAYOUT_DAY = 28;

const UpdatePartnerSettingsService = async (
  partnerId: number,
  data: SettingsData
): Promise<Partner> => {
  const partner = await Partner.findByPk(partnerId);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  const payload: Record<string, any> = {};

  if (data.pixKeyType !== undefined || data.pixKey !== undefined) {
    const pixKey = String(data.pixKey ?? partner.pixKey ?? "").trim();
    const pixKeyType = String(data.pixKeyType ?? partner.pixKeyType ?? "")
      .trim()
      .toUpperCase();

    if (pixKey && !PIX_KEY_TYPES.includes(pixKeyType as any)) {
      throw new AppError("ERR_INVALID_PIX_KEY_TYPE", 400);
    }

    payload.pixKey = pixKey || null;
    payload.pixKeyType = pixKey ? pixKeyType : null;
  }

  if (data.payoutMode !== undefined) {
    if (!["immediate", "scheduled"].includes(data.payoutMode)) {
      throw new AppError("ERR_INVALID_PAYOUT_MODE", 400);
    }
    payload.payoutMode = data.payoutMode;
  }

  if (data.payoutDay !== undefined) {
    // O modo imediato nao tem dia de fechamento: o portal manda null para
    // limpar o agendamento, e a coluna aceita nulo.
    if (data.payoutDay === null) {
      payload.payoutDay = null;
    } else {
      const day = Number(data.payoutDay);
      if (!Number.isInteger(day) || day < 1 || day > MAX_PAYOUT_DAY) {
        throw new AppError("ERR_INVALID_PAYOUT_DAY", 400);
      }
      payload.payoutDay = day;
    }
  }

  const effectiveMode = payload.payoutMode || partner.payoutMode;
  // Limpar o dia so e permitido fora do agendado, entao o valor que vale e o
  // que veio na requisicao quando o campo foi enviado.
  const effectiveDay =
    "payoutDay" in payload ? payload.payoutDay : partner.payoutDay;
  if (effectiveMode === "scheduled" && !effectiveDay) {
    throw new AppError("ERR_PAYOUT_DAY_REQUIRED", 400);
  }

  await partner.update(payload);

  // Repasses retidos por falta de chave voltam para a fila assim que ela
  // aparece: nada do que ja foi apurado se perde.
  if (partner.pixKey && partner.pixKeyType) {
    await PartnerPayout.update(
      { status: "pending", nextAttemptAt: null },
      { where: { partnerId, status: "awaiting_pix_key" } }
    );
  }

  // Mudar de modo so afeta o que ainda nao saiu, e muda quem paga a tarifa:
  // no imediato ela sai do parceiro, no agendado a plataforma absorve.
  if (payload.payoutMode) {
    const fee =
      payload.payoutMode === "immediate" ? round2(await getPartnerPixFee()) : 0;

    const openRows = await PartnerPayout.findAll({
      where: {
        partnerId,
        status: { [Op.in]: ["pending", "awaiting_pix_key", "failed"] }
      }
    });

    await Promise.all(
      openRows.map(row =>
        row.update({
          mode: payload.payoutMode,
          feeAmount: fee,
          netAmount: round2((Number(row.amount) || 0) - fee)
        })
      )
    );
  }

  await partner.reload();

  return partner;
};

export default UpdatePartnerSettingsService;
