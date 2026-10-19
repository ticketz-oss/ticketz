/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { createHmac } from "crypto";
import { Op, Transaction } from "sequelize";
import { subDays } from "date-fns";
import sequelize from "../../database";
import Invoices from "../../models/Invoices";
import PlatformIdempotencyKey from "../../models/PlatformIdempotencyKey";
import PlatformWebhookOutbox from "../../models/PlatformWebhookOutbox";
import { logger } from "../../utils/logger";

export type PlatformWebhookEvent =
  | "tenant.criado"
  | "tenant.suspenso"
  | "fatura.criada"
  | "fatura.vencida"
  | "fatura.paga"
  | "uso.atualizado";

const RETRY_DELAYS_MS = [
  0, 30_000, 120_000, 600_000, 3_600_000, 21_600_000, 86_400_000
];

export const enqueueWebhook = async (
  evento: PlatformWebhookEvent,
  tenantId: number | string,
  dados: Record<string, unknown>,
  transaction: Transaction
): Promise<PlatformWebhookOutbox> =>
  PlatformWebhookOutbox.create(
    {
      evento,
      tenantId: String(tenantId),
      payload: dados,
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date()
    } as any,
    { transaction }
  );

const webhookBody = (event: PlatformWebhookOutbox): string =>
  JSON.stringify({
    evento: event.evento,
    ocorrido_em: event.createdAt.toISOString(),
    sistema: "espaco-whats",
    tenant_id: String(event.tenantId),
    dados: event.payload
  });

export const dispatchPlatformWebhooks = async (): Promise<void> => {
  const baseUrl = process.env.PLATFORM_WEBHOOK_URL?.replace(/\/$/, "");
  const secret = process.env.PLATFORM_WEBHOOK_SECRET;
  if (!baseUrl || !secret) return;

  const events = await PlatformWebhookOutbox.findAll({
    where: {
      status: { [Op.in]: ["pending", "failed"] },
      attempts: { [Op.lt]: 7 },
      nextAttemptAt: { [Op.lte]: new Date() }
    },
    order: [["createdAt", "ASC"]],
    limit: 50
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const event of events) {
    const body = webhookBody(event);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    try {
      await axios.post(`${baseUrl}/espaco-whats`, body, {
        headers: {
          "Content-Type": "application/json",
          "X-Event-Id": event.eventId,
          "X-Timestamp": timestamp,
          "X-Signature": `sha256=${signature}`
        },
        timeout: 10_000,
        validateStatus: status => status >= 200 && status < 300
      });

      await event.update({
        status: "sent",
        attempts: event.attempts + 1,
        nextAttemptAt: null,
        lastError: null,
        sentAt: new Date()
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      const delay = RETRY_DELAYS_MS[attempts] || null;

      await event.update({
        status: "failed",
        attempts,
        nextAttemptAt: delay == null ? null : new Date(Date.now() + delay),
        lastError: error?.message || "webhook_delivery_failed"
      });
      logger.warn(
        { eventId: event.eventId, attempts, error: error?.message },
        "Platform webhook delivery failed"
      );
    }
  }
};

export const cleanupPlatformIdempotency = async (): Promise<void> => {
  await PlatformIdempotencyKey.destroy({
    where: { createdAt: { [Op.lt]: subDays(new Date(), 7) } }
  });
};

export const enqueueOverdueInvoices = async (): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const invoices = await Invoices.findAll({
    where: {
      status: "open",
      dueDate: { [Op.lt]: today },
      platformOverdueNotifiedAt: null
    },
    limit: 200
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const invoice of invoices) {
    await sequelize.transaction(async transaction => {
      const locked = await Invoices.findByPk(invoice.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (
        !locked ||
        locked.platformOverdueNotifiedAt ||
        locked.status !== "open"
      )
        return;
      await locked.update(
        { platformOverdueNotifiedAt: new Date() },
        { transaction }
      );
      await enqueueWebhook(
        "fatura.vencida",
        locked.companyId,
        {
          lancamento_id: `inv_${locked.id}`,
          external_ref: locked.externalRef,
          vencimento: locked.dueDate
        },
        transaction
      );
    });
  }
};

export const processPlatformWebhooks = async (): Promise<void> => {
  await enqueueOverdueInvoices();
  await dispatchPlatformWebhooks();
  await cleanupPlatformIdempotency();
};
