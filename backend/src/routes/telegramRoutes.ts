import { Router } from "express";
import * as TelegramController from "../controllers/TelegramController";

const telegramRoutes = Router();

// Telegram Bot webhook — no auth needed (secured by token in URL)
telegramRoutes.post("/webhook/telegram/:token", TelegramController.receive);

export default telegramRoutes;
