import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Partner from "../../models/Partner";
import PartnerPayout from "../../models/PartnerPayout";
import {
  abacateSendPix,
  PIX_MIN_AMOUNT
} from "../PaymentGatewayServices/AbacatePayServices";
import SettlePartnerPayoutBatchService, {
  batchExternalId
} from "./SettlePartnerPayoutBatchService";
import { round2 } from "./AccrualPartnerPayoutService";
import { logger } from "../../utils/logger";

// Backoff entre tentativas de um repasse que falhou no envio.
const RETRY_BACKOFF_MINUTES = 30;
const MAX_ATTEMPTS = 8;

// Espaçamento entre transferências, por causa do rate limit da API.
const SEND_SPACING_MS = 500;

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

/** Linhas prontas para sair: nunca enviadas ou que falharam e já podem voltar. */
const readyPayouts = (partnerId: number) =>
  PartnerPayout.findAll({
    where: {
      partnerId,
      status: { [Op.in]: ["pending", "failed"] },
      attempts: { [Op.lt]: MAX_ATTEMPTS },
      [Op.or]: [
        { nextAttemptAt: null },
        { nextAttemptAt: { [Op.lte]: new Date() } }
      ]
    },
    order: [["id", "ASC"]]
  });

/**
 * Envia um grupo de linhas como uma única transferência PIX.
 *
 * O lote é a unidade de envio nos dois modos — o imediato é apenas um lote de
 * tamanho 1. Isso evita dois caminhos paralelos de envio.
 */
const sendBatch = async (
  partner: Partner,
  rows: PartnerPayout[]
): Promise<void> => {
  const total = round2(
    rows.reduce((sum, row) => sum + (Number(row.netAmount) || 0), 0)
  );

  if (total < PIX_MIN_AMOUNT) {
    // Abaixo do mínimo da API: fica para o próximo lote, acumulando.
    logger.debug(
      `[partnerPayouts] parceiro ${partner.id}: lote de R$ ${total} abaixo do mínimo, adiado`
    );
    return;
  }

  const batchId = uuidv4();
  const externalId = batchExternalId(batchId);
  const ids = rows.map(row => row.id);

  await PartnerPayout.update(
    {
      status: "processing",
      batchId,
      externalId,
      failReason: null,
      nextAttemptAt: null
    },
    { where: { id: { [Op.in]: ids } } }
  );

  await PartnerPayout.increment("attempts", {
    where: { id: { [Op.in]: ids } }
  });

  try {
    const transaction = await abacateSendPix({
      amount: total,
      externalId,
      description: `Repasse ${partner.name}`,
      pixKey: partner.pixKey,
      pixKeyType: partner.pixKeyType
    });

    // PENDING mantém as linhas em `processing`; a reconciliação fecha depois.
    await SettlePartnerPayoutBatchService({
      batchId,
      status: transaction.status,
      txId: transaction.id,
      receiptUrl: transaction.receiptUrl
    });
  } catch (error) {
    const reason =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "erro desconhecido";

    logger.error(
      `[partnerPayouts] falha ao enviar lote ${batchId}: ${JSON.stringify(reason)}`
    );

    // Sem confirmação de que a transferência não saiu, a reconciliação por
    // externalId ainda pode encontrá-la — por isso agendamos nova tentativa em
    // vez de reenviar imediatamente.
    await PartnerPayout.update(
      {
        status: "failed",
        failReason: String(
          typeof reason === "string" ? reason : JSON.stringify(reason)
        ).slice(0, 500),
        nextAttemptAt: new Date(Date.now() + RETRY_BACKOFF_MINUTES * 60 * 1000)
      },
      { where: { id: { [Op.in]: ids }, status: "processing" } }
    );
  }
};

/**
 * Decide se hoje é dia de fechar o mês de um parceiro agendado.
 * `payoutDay` é limitado a 28 no cadastro, então todo mês tem esse dia.
 */
const isPayoutDay = (partner: Partner): boolean => {
  const day = Number(partner.payoutDay) || 0;
  if (day < 1) return false;
  return new Date().getDate() === day;
};

interface SendParams {
  // Restringe a um parceiro (usado no envio imediato após um pagamento).
  partnerId?: number;
  // Ignora o dia agendado (reenvio manual pelo super admin).
  force?: boolean;
}

const SendPartnerPayoutsService = async ({
  partnerId,
  force = false
}: SendParams = {}): Promise<void> => {
  const where: Record<string, any> = { status: true };
  if (partnerId) {
    where.id = partnerId;
  }

  const partners = await Partner.findAll({ where });

  for (const partner of partners) {
    const rows = await readyPayouts(partner.id);

    if (!rows.length) {
      continue;
    }

    if (!partner.pixKey || !partner.pixKeyType) {
      // Nada se perde: as linhas ficam retidas e voltam para `pending` assim
      // que o parceiro cadastrar a chave.

      await PartnerPayout.update(
        { status: "awaiting_pix_key" },
        { where: { id: { [Op.in]: rows.map(r => r.id) } } }
      );
      continue;
    }

    const scheduled = partner.payoutMode === "scheduled";

    if (scheduled && !force && !isPayoutDay(partner)) {
      continue;
    }

    // Agendado: tudo numa transferência só. Imediato: uma por linha, já que
    // cada linha reservou a sua própria tarifa no accrual.
    const batches = scheduled ? [rows] : rows.map(row => [row]);

    for (const batch of batches) {
      await sendBatch(partner, batch);

      await sleep(SEND_SPACING_MS);
    }
  }
};

export default SendPartnerPayoutsService;
