import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import DeleteBaileysService from "../../services/BaileysServices/DeleteBaileysService";

jest.mock("libzapitu-rf", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("libzapitu-rf/worker", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../models/Whatsapp", () => ({
  __esModule: true,
  default: class {
    static findOne = jest.fn();
  }
}));
jest.mock("../../helpers/authState", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ state: {}, saveState: jest.fn() })
}));
jest.mock("../../services/BaileysServices/DeleteBaileysService", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../services/SettingServices/GetPublicSettingService", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue("Ticketz")
}));
jest.mock("../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn().mockResolvedValue("disabled")
}));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  loggerBaileys: {}
}));
jest.mock("../../services/WbotServices/StartWhatsAppSession", () => ({}));
jest.mock(
  "../../services/WhatsappService/SocketSendWhatsappUpdate",
  () => ({})
);
jest.mock("../../models/Contact", () => ({}));
jest.mock("../../models/Ticket", () => ({}));
jest.mock("../../models/Message", () => ({}));
jest.mock("../../models/OutOfTicketMessages", () => ({}));
jest.mock("../../models/BaileysKeys", () => ({}));
jest.mock("../../models/WhatsappLidMap", () => ({}));
jest.mock(
  "../../services/DecoupledDriverServices/DecoupledDriverServices",
  () => ({
    DecoupledDriverServices: {
      getInstance: () => ({ registerFunction: jest.fn() })
    }
  })
);
jest.mock("../../services/TicketServices/ShowTicketService", () => ({}));
jest.mock("../../helpers/GetTicketWbot", () => ({}));
jest.mock("../../services/WbotServices/getJidOf", () => ({}));

test("QR expiration emits the disconnected session to its company admins", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue([2, 3000, 0])
  });
  try {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const socketModule: { getIO: jest.Mock } =
      jest.requireMock("../../libs/socket");
    socketModule.getIO.mockReturnValue({ to });

    const whatsapp = Object.assign(new Whatsapp(), {
      id: 12,
      companyId: 7,
      name: "Test",
      provider: "stable",
      status: "",
      qrcode: "",
      update: jest.fn().mockImplementation(function (values) {
        Object.assign(whatsapp, values);
        return Promise.resolve(whatsapp);
      })
    });
    jest.mocked(Whatsapp.findOne).mockResolvedValue(whatsapp);

    let registerConnectionUpdate: (
      callback: (update: { qr: string }) => Promise<void>
    ) => void;
    const connectionUpdate = new Promise<
      (update: { qr: string }) => Promise<void>
    >(resolve => {
      registerConnectionUpdate = resolve;
    });
    const removeAllListeners = jest.fn();
    const close = jest.fn();
    const baileysModule: { default: jest.Mock } =
      jest.requireMock("libzapitu-rf");
    baileysModule.default.mockReturnValue({
      ev: {
        on: jest.fn(
          (
            event: string,
            callback: (update: { qr: string }) => Promise<void>
          ) => {
            if (event === "connection.update")
              registerConnectionUpdate(callback);
          }
        ),
        removeAllListeners
      },
      ws: { on: jest.fn(), close }
    });

    void initWASocket(whatsapp);
    const onConnectionUpdate = await connectionUpdate;
    for (let i = 0; i < 4; i += 1) {
      await onConnectionUpdate({ qr: `qr-${i}` });
    }

    expect(whatsapp.status).toBe("DISCONNECTED");
    expect(whatsapp.qrcode).toBe("");
    expect(DeleteBaileysService).toHaveBeenCalledWith(12);
    expect(to).toHaveBeenLastCalledWith("company-7-admin");
    expect(emit).toHaveBeenLastCalledWith("company-7-whatsappSession", {
      action: "update",
      session: whatsapp
    });
    expect(removeAllListeners).toHaveBeenCalledWith("connection.update");
    expect(close).toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
