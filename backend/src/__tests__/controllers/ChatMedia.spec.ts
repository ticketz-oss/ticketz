import { Request, Response } from "express";
import { saveMessage } from "../../controllers/ChatController";
import CreateMessageService from "../../services/ChatService/CreateMessageService";
import Chat from "../../models/Chat";
import { getIO } from "../../libs/socket";

jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../models/Chat", () => ({ findByPk: jest.fn() }));
jest.mock("../../models/User", () => ({}));
jest.mock("../../models/ChatUser", () => ({}));
jest.mock("../../services/ChatService/CreateService", () => jest.fn());
jest.mock("../../services/ChatService/ListService", () => jest.fn());
jest.mock("../../services/ChatService/ShowFromUuidService", () => jest.fn());
jest.mock("../../services/ChatService/DeleteService", () => jest.fn());
jest.mock("../../services/ChatService/FindMessages", () => jest.fn());
jest.mock("../../services/ChatService/UpdateService", () => jest.fn());
jest.mock("../../services/ChatService/CreateMessageService", () => jest.fn());

beforeEach(() => {
  (Chat.findByPk as jest.Mock).mockResolvedValue({ users: [{ userId: 1 }] });
  (getIO as jest.Mock).mockReturnValue({ to: () => ({ emit: jest.fn() }) });
  (CreateMessageService as jest.Mock).mockImplementation(async data => ({
    id: 1,
    ...data
  }));
});

it.each(["  Legenda da imagem  ", "", undefined])(
  "stores the caption separately from the original filename: %s",
  async caption => {
    const req = {
      user: { id: "1", companyId: 1 },
      params: { id: "7" },
      body: { message: caption },
      files: [
        {
          originalname: "foto.png",
          filename: "stored.png",
          mimetype: "image/png"
        }
      ]
    } as unknown as Request;
    const res = { json: jest.fn() } as unknown as Response;
    await saveMessage(req, res);
    expect(CreateMessageService).toHaveBeenCalledWith({
      chatId: 7,
      senderId: 1,
      message: caption?.trim() || "",
      mediaName: "foto.png",
      mediaPath: "stored.png",
      mediaType: "image"
    });
  }
);

it("keeps ordinary text sending unchanged", async () => {
  await saveMessage(
    {
      user: { id: "1", companyId: 1 },
      params: { id: "7" },
      body: { message: "Texto" }
    } as unknown as Request,
    { json: jest.fn() } as unknown as Response
  );
  expect(CreateMessageService).toHaveBeenCalledWith({
    chatId: 7,
    senderId: 1,
    message: "Texto"
  });
});
