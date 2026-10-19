import Whatsapp from "../../../models/Whatsapp";
import Ticket from "../../../models/Ticket";
import { SendWhatsAppMedia } from "../SendWhatsAppMedia";
import SendMetaMediaMessageService from "../../MetaWhatsAppServices/SendMetaMediaMessageService";
import GetTicketWbot from "../../../helpers/GetTicketWbot";

jest.mock("../../../models/Whatsapp");
jest.mock("../../MetaWhatsAppServices/SendMetaMediaMessageService", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    key: { id: "wamid.1", fromMe: true, remoteJid: "5568999999999" },
    message: { conversation: "photo.png" }
  })
}));
// Guards against the Baileys path actually reaching real filesystem/storage
// I/O with a bogus path, which hangs instead of failing fast.
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  createReadStream: jest.fn(() => ({
    destroy: jest.fn(),
    pipe: jest.fn(),
    on: jest.fn()
  }))
}));
jest.mock("../../../helpers/saveMediaFile", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue("media/1/fake.png")
}));
// CheckSettings hits the real DB (Setting.findOne) - unreachable here, and
// hangs instead of failing fast.
jest.mock("../../../helpers/CheckSettings", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue("15")
}));
// wbotMessageListener and GetTicketWbot transitively import libs/wbot ->
// libs/socket, which opens a real ioredis connection at module load time -
// unreachable here, and it retries for a long time before giving up.
jest.mock("../wbotMessageListener", () => ({
  verifyMediaMessage: jest.fn(),
  verifyMessage: jest.fn()
}));
jest.mock("../../../helpers/GetTicketWbot", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.setTimeout(8000);

const media = {
  path: "/tmp/does-not-exist.png",
  originalname: "photo.png",
  mimetype: "image/png",
  size: 10
} as Express.Multer.File;

describe("SendWhatsAppMedia connection dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("envia pela Cloud API e nao encosta na sessao Baileys numa conexao oficial", async () => {
    const connection = { id: 5, apiMode: "official", status: "CONNECTED" };
    (Whatsapp.findByPk as jest.Mock).mockResolvedValue(connection);
    const ticket = { whatsappId: 5 } as Ticket;

    await SendWhatsAppMedia({ media, ticket, caption: "segue o boleto" });

    expect(SendMetaMediaMessageService).toHaveBeenCalledWith({
      media,
      ticket,
      connection,
      caption: "segue o boleto"
    });
    expect(GetTicketWbot).not.toHaveBeenCalled();
  });
});

it("does not send media using retained tokens after disconnect", async () => {
  jest.clearAllMocks();
  (Whatsapp.findByPk as jest.Mock).mockResolvedValue({
    id: 5,
    apiMode: "official",
    status: "DISCONNECTED"
  });
  await expect(
    SendWhatsAppMedia({ media, ticket: { id: 7, whatsappId: 5 } as Ticket })
  ).rejects.toMatchObject({ message: "ERR_WAPP_NOT_INITIALIZED" });
  expect(SendMetaMediaMessageService).not.toHaveBeenCalled();
  expect(GetTicketWbot).not.toHaveBeenCalled();
});
