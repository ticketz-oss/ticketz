import fs from "fs";
import Ticket from "../../../models/Ticket";
import Whatsapp from "../../../models/Whatsapp";
import { buildMetaWbot } from "../MetaWbotAdapter";
import SendMetaMediaMessageService from "../SendMetaMediaMessageService";
import SendMetaTextMessageService, {
  postMetaText
} from "../SendMetaTextMessageService";

jest.mock("../SendMetaMediaMessageService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../SendMetaTextMessageService", () => ({
  __esModule: true,
  default: jest.fn(),
  postMetaText: jest.fn()
}));
jest.mock("../SendMetaInteractiveMessageService", () => ({
  postMetaInteractiveMenu: jest.fn()
}));

beforeEach(() => jest.clearAllMocks());
it.each([
  ["image.png", "image/png"],
  ["audio.mp3", "audio/mpeg"],
  ["document.pdf", "application/pdf"]
])(
  "routes chatbot %s through official media persistence",
  async (filename, mimetype) => {
    const stat = jest
      .spyOn(fs.promises, "stat")
      .mockResolvedValue({ size: 123 } as never);
    const connection = {
      id: 3,
      apiMode: "official",
      metaPhoneNumberId: "phone",
      metaAccessToken: "token"
    } as Whatsapp;
    const ticket = { id: 7 } as Ticket;
    try {
      await buildMetaWbot(connection).sendChatbotMedia(
        ticket,
        `/tmp/${filename}`,
        filename,
        "caption"
      );
      expect(SendMetaMediaMessageService).toHaveBeenCalledWith({
        connection,
        ticket,
        caption: mimetype.startsWith("audio/") ? undefined : "caption",
        media: {
          path: `/tmp/${filename}`,
          originalname: filename,
          mimetype,
          size: 123
        }
      });
      expect(postMetaText).not.toHaveBeenCalled();
      if (mimetype.startsWith("audio/")) {
        expect(SendMetaTextMessageService).toHaveBeenCalledWith({
          connection,
          ticket,
          body: "caption"
        });
      }
    } finally {
      stat.mockRestore();
    }
  }
);
