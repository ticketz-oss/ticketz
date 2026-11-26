import { Op, Transaction } from "sequelize";
import { v4 as uuid } from "uuid";
import sequelize from "../../database";
import Whatsapp from "../../models/Whatsapp";
import BaileysKeys from "../../models/BaileysKeys";
import BaileysContact from "../../models/BaileysContact";
import BaileysSession from "../../models/BaileysSession";
import BaileysSessionKey from "../../models/BaileysSessionKey";
import BaileysSessionContact from "../../models/BaileysSessionContact";
import { convertLegacyBaileysSession } from "./LegacyBaileysSession";
import { isCurrentSession } from "./SessionFence";
import { logger } from "../../utils/logger";

const cleanupRetries = new Map<number, NodeJS.Timeout>();

export class StaleBaileysSessionError extends Error {
  constructor() {
    super("Baileys session is no longer active");
  }
}

export async function withActiveBaileysSession<T>(
  whatsappId: number,
  sessionId: string,
  work: (whatsapp: Whatsapp, transaction: Transaction) => Promise<T>
): Promise<T> {
  return sequelize.transaction(async transaction => {
    const whatsapp = await Whatsapp.findByPk(whatsappId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (
      !whatsapp ||
      whatsapp.channel !== "whatsapp" ||
      !isCurrentSession(whatsapp.activeBaileysSessionId, sessionId)
    ) {
      throw new StaleBaileysSessionError();
    }
    return work(whatsapp, transaction);
  });
}

export async function ensureBaileysSession(
  whatsappId: number,
  expectedSessionId?: string
): Promise<BaileysSession> {
  return sequelize.transaction(async transaction => {
    const whatsapp = await Whatsapp.findByPk(whatsappId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!whatsapp || whatsapp.channel !== "whatsapp") {
      throw new Error("WhatsApp connection not found");
    }
    if (
      expectedSessionId &&
      !isCurrentSession(whatsapp.activeBaileysSessionId, expectedSessionId)
    ) {
      throw new StaleBaileysSessionError();
    }
    const legacyKeys = await BaileysKeys.findAll({
      where: { whatsappId },
      transaction
    });
    const legacyContacts = await BaileysContact.findAll({
      where: { whatsappId },
      transaction
    });
    const hasLegacyData =
      !!whatsapp.session || legacyKeys.length > 0 || legacyContacts.length > 0;
    if (whatsapp.activeBaileysSessionId && !hasLegacyData) {
      const session = await BaileysSession.findOne({
        where: { id: whatsapp.activeBaileysSessionId, whatsappId },
        transaction
      });
      if (!session) throw new Error("Active Baileys session not found");
      return session;
    }
    if (expectedSessionId) throw new StaleBaileysSessionError();

    const converted = convertLegacyBaileysSession(
      whatsapp.session,
      legacyKeys.map(({ type, key, value }) => ({ type, key, value }))
    );
    const sessionId = uuid();
    const session = await BaileysSession.create(
      { id: sessionId, whatsappId, credentials: converted.credentials },
      { transaction }
    );
    await BaileysSessionKey.bulkCreate(
      converted.keys.map(key => ({ ...key, sessionId })),
      { transaction }
    );
    await BaileysSessionContact.bulkCreate(
      legacyContacts.map(contact => ({
        sessionId,
        contactId: contact.contactId,
        payload: contact.payload,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      })),
      { transaction }
    );
    await whatsapp.update(
      { activeBaileysSessionId: sessionId, session: "" },
      { transaction }
    );
    await BaileysKeys.destroy({ where: { whatsappId }, transaction });
    await BaileysContact.destroy({ where: { whatsappId }, transaction });
    return session;
  });
}

export async function resetBaileysSession(
  whatsappId: number,
  expectedSessionId?: string,
  isCurrent?: () => boolean
): Promise<{ whatsapp: Whatsapp; previousSessionId: string | null }> {
  return sequelize.transaction(async transaction => {
    const whatsapp = await Whatsapp.findByPk(whatsappId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!whatsapp || whatsapp.channel !== "whatsapp") {
      throw new Error("WhatsApp connection not found");
    }
    if (
      (expectedSessionId &&
        !isCurrentSession(
          whatsapp.activeBaileysSessionId,
          expectedSessionId,
          !isCurrent || isCurrent()
        )) ||
      (!expectedSessionId && isCurrent && !isCurrent())
    ) {
      throw new StaleBaileysSessionError();
    }
    const previousSessionId = whatsapp.activeBaileysSessionId || null;
    const sessionId = uuid();
    await BaileysSession.create(
      { id: sessionId, whatsappId, credentials: null },
      { transaction }
    );
    if (previousSessionId) {
      await BaileysSession.update(
        { retiredAt: new Date() },
        { where: { id: previousSessionId }, transaction }
      );
    }
    await whatsapp.update(
      {
        activeBaileysSessionId: sessionId,
        session: "",
        status: "DISCONNECTED",
        qrcode: "",
        retries: 0
      },
      { transaction }
    );
    await BaileysKeys.destroy({ where: { whatsappId }, transaction });
    await BaileysContact.destroy({ where: { whatsappId }, transaction });
    return { whatsapp, previousSessionId };
  });
}

export async function cleanupRetiredBaileysSessions(
  whatsappId: number
): Promise<void> {
  try {
    await BaileysSession.destroy({
      where: { whatsappId, retiredAt: { [Op.ne]: null } }
    });
    const timer = cleanupRetries.get(whatsappId);
    if (timer) clearTimeout(timer);
    cleanupRetries.delete(whatsappId);
  } catch (error) {
    logger.error({ whatsappId }, "Failed to clean up retired Baileys sessions");
    if (!cleanupRetries.has(whatsappId)) {
      const timer = setTimeout(() => {
        cleanupRetries.delete(whatsappId);
        cleanupRetiredBaileysSessions(whatsappId).catch(() => {
          // The cleanup function logs the failure and schedules another retry.
        });
      }, 10000);
      timer.unref();
      cleanupRetries.set(whatsappId, timer);
    }
    throw error;
  }
}
