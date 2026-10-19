import Whatsapp from "../../../models/Whatsapp";
import HandleMetaInboundMessageService from "../HandleMetaInboundMessageService";
import FindOrCreateTicketServiceMeta from "../../TicketServices/FindOrCreateTicketServiceMeta";
import CreateMessageService from "../../MessageServices/CreateMessageService";
import DownloadMetaMediaService from "../DownloadMetaMediaService";
import saveMediaToFile from "../../../helpers/saveMediaFile";
import HandleMetaInboundFlowService from "../HandleMetaInboundFlowService";
import FindOrCreateMetaContactService from "../FindOrCreateMetaContactService";

jest.mock("../FindOrCreateMetaContactService", () => jest.fn());
jest.mock("../../TicketServices/FindOrCreateTicketServiceMeta", () =>
  jest.fn()
);
jest.mock("../../MessageServices/CreateMessageService", () => jest.fn());
jest.mock("../DownloadMetaMediaService", () => jest.fn());
jest.mock("../../../helpers/saveMediaFile", () => jest.fn());
jest.mock("../HandleMetaInboundFlowService", () => ({
  __esModule: true,
  default: jest.fn(),
  captureMetaRating: jest.fn().mockResolvedValue(false)
}));

const createContact = FindOrCreateMetaContactService as jest.Mock;
const findTicket = FindOrCreateTicketServiceMeta as jest.Mock;
const createMessage = CreateMessageService as jest.Mock;
const downloadMedia = DownloadMetaMediaService as jest.Mock;
const saveMedia = saveMediaToFile as jest.Mock;
const handleFlow = HandleMetaInboundFlowService as jest.Mock;

const whatsapp = { id: 16, companyId: 9 } as Whatsapp;
const ticket = { id: 55, status: "open", update: jest.fn() };

const inbound = (message: Record<string, unknown>) =>
  HandleMetaInboundMessageService(whatsapp, undefined, {
    id: "wamid.1",
    from: "5568999999999",
    timestamp: "1789000000",
    ...message
  } as never);

const savedMessage = () =>
  createMessage.mock.calls[0][0].messageData as {
    body: string;
    mediaType?: string;
    quotedMsgId?: string;
  };

describe("HandleMetaInboundMessageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createContact.mockResolvedValue({ id: 42 });
    findTicket.mockResolvedValue({ ticket, justCreated: true });
    downloadMedia.mockResolvedValue({
      content: Buffer.from("x"),
      mimetype: "audio/ogg"
    });
    saveMedia.mockResolvedValue("55/audio.oga");
  });

  it("preserves the customer send time when webhook delivery is delayed", async () => {
    await inbound({
      type: "text",
      text: { body: "Mensagem antiga" },
      timestamp: "1700000000"
    });
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageData: expect.objectContaining({
          createdAt: new Date(1700000000000)
        })
      })
    );
  });

  // A regressao a evitar: tipo fora da lista sumia sem deixar rastro, e o
  // atendente nao ficava sabendo que o cliente mandou algo.
  it("guarda a localizacao com link de mapa em vez de descartar", async () => {
    await inbound({
      type: "location",
      location: {
        latitude: -9.97,
        longitude: -67.8,
        name: "Oficina",
        address: "Rua X, 100"
      }
    });

    expect(savedMessage().body).toContain("Oficina - Rua X, 100");
    expect(savedMessage().body).toContain("-9.97,-67.8");
  });

  it("guarda o contato compartilhado com nome e telefone", async () => {
    await inbound({
      type: "contacts",
      contacts: [
        {
          name: { formatted_name: "Maria Silva" },
          phones: [{ phone: "+55 68 99999-0000" }]
        }
      ]
    });

    expect(savedMessage().body).toBe("👤 Maria Silva - +55 68 99999-0000");
  });

  it("prende a reacao na mensagem original, como o Baileys faz", async () => {
    await inbound({
      type: "reaction",
      reaction: { message_id: "wamid.original", emoji: "👍" }
    });

    expect(savedMessage()).toMatchObject({
      body: "👍",
      mediaType: "reactionMessage",
      quotedMsgId: "wamid.original"
    });
  });

  it.each([
    ["button", { button: { text: "Quero renegociar" } }, "Quero renegociar"],
    [
      "interactive",
      { interactive: { button_reply: { title: "Segunda via" } } },
      "Segunda via"
    ]
  ])("guarda a escolha de %s", async (type, payload, expected) => {
    await inbound({ type, ...payload });

    expect(savedMessage().body).toBe(expected);
  });

  it("exibe o titulo escolhido e entrega o id do botao ao fluxo", async () => {
    await inbound({
      type: "interactive",
      interactive: {
        list_reply: { id: "3", title: "BOLETOS" }
      }
    });

    expect(savedMessage().body).toBe("BOLETOS");
    expect(handleFlow).toHaveBeenCalledWith(
      expect.objectContaining({ body: "3", justCreated: true })
    );
    expect(
      JSON.parse(createMessage.mock.calls[0][0].messageData.dataJson)
        .interactiveSelectionId
    ).toBe("3");
  });

  it("nunca descarta um tipo desconhecido em silencio", async () => {
    await inbound({ type: "ephemeral_whatever" });

    expect(createMessage).toHaveBeenCalled();
    expect(savedMessage().body).toBe(
      "[mensagem não suportada: ephemeral_whatever]"
    );
  });

  it("mantem o texto simples intacto", async () => {
    await inbound({ type: "text", text: { body: "oi" } });

    expect(savedMessage().body).toBe("oi");
  });

  // A Meta so manda filename em documento. Em audio/imagem o nome e inventado
  // aqui a partir do wamid, e ele estava vazando como legenda embaixo da midia.
  it("nao inventa legenda para audio sem legenda", async () => {
    await inbound({
      type: "audio",
      audio: { id: "media.1", mime_type: "audio/ogg; codecs=opus", voice: true }
    });

    expect(savedMessage().body).toBe("");
    expect(ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ lastMessage: "📎 Áudio" })
    );
  });

  it("preserva a legenda que o cliente escreveu na imagem", async () => {
    await inbound({
      type: "image",
      image: { id: "media.2", mime_type: "image/jpeg", caption: "segue o erro" }
    });

    expect(savedMessage().body).toBe("segue o erro");
  });

  // Documento e o unico caso em que o nome e real, e o atendente precisa dele.
  it("usa o nome real do documento na lista de tickets", async () => {
    await inbound({
      type: "document",
      document: {
        id: "media.3",
        mime_type: "application/pdf",
        filename: "boleto-outubro.pdf"
      }
    });

    expect(ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ lastMessage: "📎 boleto-outubro.pdf" })
    );
  });
});
