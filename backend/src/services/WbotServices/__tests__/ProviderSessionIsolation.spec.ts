import Whatsapp from "../../../models/Whatsapp";
import { initWASocket } from "../../../libs/wbot";
import { StartWhatsAppSession } from "../StartWhatsAppSession";
import { StartAllWhatsAppsSessions } from "../StartAllWhatsAppsSessions";
import { wbotMessageListener } from "../wbotMessageListener";
import wbotMonitor from "../wbotMonitor";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../../libs/wbot", () => ({ initWASocket: jest.fn() }));
jest.mock("../wbotMessageListener", () => ({ wbotMessageListener: jest.fn() }));
jest.mock("../wbotMonitor", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../../utils/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() }
}));
jest.mock("../../WhatsappService/SocketSendWhatsappUpdate", () => ({
  sendWhatsappUpdate: jest.fn()
}));

const environment = { ...process.env };
const connection = (apiMode: string, session = "saved-session") =>
  ({
    id: apiMode === "official" ? 10 : 20,
    companyId: 3,
    channel: "whatsapp",
    apiMode,
    session,
    update: jest.fn().mockResolvedValue(undefined)
  }) as unknown as Whatsapp;

beforeEach(() => {
  process.env = { ...environment };
  delete process.env.TENANT_RUNTIME_COMPANY_ID;
  delete process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS;
  delete process.env.WHATSAPP_AUTOSTART_ENABLED;
  delete process.env.WHATSAPP_AUTOSTART_EXISTING_ONLY;
  jest.clearAllMocks();
  (initWASocket as jest.Mock).mockResolvedValue({ id: 20 });
});

afterAll(() => {
  process.env = environment;
});

it("never opens a Baileys socket or changes official status on direct refresh", async () => {
  const official = connection("official");
  await StartWhatsAppSession(official, 3, true);
  expect(official.update).not.toHaveBeenCalled();
  expect(initWASocket).not.toHaveBeenCalled();
  expect(wbotMessageListener).not.toHaveBeenCalled();
  expect(wbotMonitor).not.toHaveBeenCalled();
});

it("preserves Baileys startup and its message listeners", async () => {
  const baileys = connection("baileys");
  await StartWhatsAppSession(baileys, 3, true);
  expect(baileys.update).toHaveBeenCalledWith({ status: "OPENING" });
  expect(initWASocket).toHaveBeenCalledWith(baileys, null, true);
  expect(wbotMessageListener).toHaveBeenCalledWith({ id: 20 }, 3);
  expect(wbotMonitor).toHaveBeenCalledWith({ id: 20 }, baileys, 3);
});

it("starts only Baileys when startup enumerates both kinds of connections", async () => {
  const official = connection("official");
  const baileys = connection("baileys");
  (Whatsapp.findAll as jest.Mock).mockResolvedValue([official, baileys]);
  await StartAllWhatsAppsSessions(3);
  await Promise.resolve();
  expect(official.update).not.toHaveBeenCalled();
  expect(initWASocket).toHaveBeenCalledTimes(1);
  expect(initWASocket).toHaveBeenCalledWith(baileys, null, false);
});

it("does not touch tenants owned by another runtime", async () => {
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "3";
  await StartAllWhatsAppsSessions(3);
  expect(Whatsapp.findAll).not.toHaveBeenCalled();
  await expect(
    StartWhatsAppSession(connection("baileys"), 3)
  ).rejects.toMatchObject({
    message: "ERR_FORBIDDEN"
  });
  expect(initWASocket).not.toHaveBeenCalled();
});

it("respects existing-session-only startup for Baileys", async () => {
  process.env.WHATSAPP_AUTOSTART_EXISTING_ONLY = "true";
  (Whatsapp.findAll as jest.Mock).mockResolvedValue([
    connection("baileys", "")
  ]);
  await StartAllWhatsAppsSessions(3);
  expect(initWASocket).not.toHaveBeenCalled();
});
