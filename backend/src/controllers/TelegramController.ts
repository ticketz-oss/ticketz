import { Request, Response } from "express";
import { logger } from "../utils/logger";
import Whatsapp from "../models/Whatsapp";
import { processTelegramUpdate } from "../services/TelegramServices/TelegramMessageListener";

// POST /webhook/telegram/:token
export const receive = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info({ token: req.params.token, body: req.body }, "Telegram Webhook: Recebido requisição do Telegram");
  // Always reply 200 immediately
  res.status(200).json({ ok: true });

  const { token } = req.params;
  const update = req.body;

  try {
    const whatsapp = await Whatsapp.findOne({
      where: { telegramToken: token, channel: "telegram" }
    });

    if (!whatsapp) {
      logger.warn(
        { token },
        "TelegramController: no connection for token"
      );
      return;
    }

    await processTelegramUpdate(whatsapp, update);
  } catch (err) {
    logger.error({ err }, "TelegramController.receive: error");
  }
};
