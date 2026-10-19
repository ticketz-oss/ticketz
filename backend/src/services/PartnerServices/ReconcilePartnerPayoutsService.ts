import { Op } from "sequelize";
import PartnerPayout from "../../models/PartnerPayout";
import { abacateGetPix } from "../PaymentGatewayServices/AbacatePayServices";
import SettlePartnerPayoutBatchService, {
  batchExternalId
} from "./SettlePartnerPayoutBatchService";
import { logger } from "../../utils/logger";

// Dá tempo da transferência aparecer na API antes da primeira consulta.
const MIN_AGE_MS = 60 * 1000;

// Depois disso, uma transferência que a API não conhece é considerada perdida.
const LOST_AFTER_MS = 30 * 60 * 1000;

/**
 * Fonte de verdade do desfecho dos repasses.
 *
 * A documentação da AbacatePay não publica o formato do `data` dos eventos
 * `transfer.*`, então o webhook é apenas um acelerador: quem realmente fecha
 * os lotes é este polling, que consulta pelo nosso próprio `externalId`.
 */
const ReconcilePartnerPayoutsService = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - MIN_AGE_MS);

  const pending = await PartnerPayout.findAll({
    where: { status: "processing", updatedAt: { [Op.lte]: cutoff } },
    attributes: ["batchId"],
    group: ["batchId"]
  });

  const batchIds = pending.map(row => row.batchId).filter(Boolean);

  for (const batchId of batchIds) {
    try {
      const transaction = await abacateGetPix({
        externalId: batchExternalId(batchId)
      });

      if (!transaction) {
        const oldest = await PartnerPayout.findOne({
          where: { batchId, status: "processing" },
          order: [["updatedAt", "ASC"]]
        });

        if (
          oldest &&
          Date.now() - new Date(oldest.updatedAt).getTime() > LOST_AFTER_MS
        ) {
          // A API não conhece o externalId: a transferência nunca chegou a
          // existir, então é seguro devolver as linhas para a fila.

          await SettlePartnerPayoutBatchService({
            batchId,
            status: "CANCELLED",
            failReason: "Transferência não encontrada na AbacatePay"
          });
        }
        continue;
      }

      await SettlePartnerPayoutBatchService({
        batchId,
        status: transaction.status,
        txId: transaction.id,
        receiptUrl: transaction.receiptUrl
      });
    } catch (error) {
      logger.error(
        `[partnerPayouts] erro ao reconciliar lote ${batchId}: ${error?.message}`
      );
    }
  }
};

export default ReconcilePartnerPayoutsService;
