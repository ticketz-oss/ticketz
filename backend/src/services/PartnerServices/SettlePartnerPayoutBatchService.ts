import PartnerPayout from "../../models/PartnerPayout";
import { logger } from "../../utils/logger";

export const PAYOUT_EXTERNAL_PREFIX = "pp-";

export const batchExternalId = (batchId: string): string =>
  `${PAYOUT_EXTERNAL_PREFIX}${batchId}`;

/**
 * Extrai o batchId de um externalId nosso. Retorna null para externalIds de
 * outros fluxos (cobranças, por exemplo), que devem ser ignorados.
 */
export const batchIdFromExternalId = (
  externalId?: string | null
): string | null => {
  if (!externalId || !externalId.startsWith(PAYOUT_EXTERNAL_PREFIX)) {
    return null;
  }
  const batchId = externalId.slice(PAYOUT_EXTERNAL_PREFIX.length);
  return batchId || null;
};

interface SettleParams {
  batchId: string;
  // Status da PixTransaction na AbacatePay.
  status: string;
  txId?: string;
  receiptUrl?: string;
  failReason?: string;
}

/**
 * Aplica o desfecho de uma transferência a todas as linhas do lote.
 *
 * Deliberadamente não conhece o cliente HTTP da AbacatePay: é chamado tanto
 * pelo webhook (que já recebe o payload) quanto pela reconciliação por
 * polling (que consulta antes). Isso evita import circular entre
 * AbacatePayServices e o motor de repasse.
 *
 * Só mexe em linhas `processing`: uma linha já `paid` nunca volta atrás, o que
 * torna o replay do webhook inofensivo.
 */
const SettlePartnerPayoutBatchService = async ({
  batchId,
  status,
  txId,
  receiptUrl,
  failReason
}: SettleParams): Promise<number> => {
  const normalized = String(status || "").toUpperCase();

  const common: Record<string, any> = {};
  if (txId) common.txId = txId;
  if (receiptUrl) common.receiptUrl = receiptUrl;

  if (normalized === "COMPLETE") {
    const [affected] = await PartnerPayout.update(
      { ...common, status: "paid", paidAt: new Date(), failReason: null },
      { where: { batchId, status: "processing" } }
    );
    if (affected) {
      logger.info(`[partnerPayouts] lote ${batchId} pago (${affected} linhas)`);
    }
    return affected;
  }

  if (["CANCELLED", "EXPIRED", "REFUNDED"].includes(normalized)) {
    // Volta para a fila: o job tenta de novo em um lote futuro.
    const [affected] = await PartnerPayout.update(
      {
        ...common,
        status: "failed",
        failReason: failReason || `Transferência ${normalized}`
      },
      { where: { batchId, status: "processing" } }
    );
    if (affected) {
      logger.warn(
        `[partnerPayouts] lote ${batchId} falhou (${normalized}, ${affected} linhas)`
      );
    }
    return affected;
  }

  // PENDING ou status desconhecido: mantém processing e só grava o que chegou.
  if (Object.keys(common).length) {
    const [affected] = await PartnerPayout.update(common, {
      where: { batchId, status: "processing" }
    });
    return affected;
  }

  return 0;
};

export default SettlePartnerPayoutBatchService;
