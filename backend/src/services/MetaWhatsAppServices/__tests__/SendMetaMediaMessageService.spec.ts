import {
  META_MEDIA_UPLOAD_TIMEOUT_MS,
  resolveMetaMediaKind
} from "../SendMetaMediaMessageService";
import PersistMetaOutboundMessageService from "../PersistMetaOutboundMessageService";
import CreateMessageService from "../../MessageServices/CreateMessageService";
import Ticket from "../../../models/Ticket";

jest.mock("../../MessageServices/CreateMessageService", () => jest.fn());

const createMessage = CreateMessageService as jest.MockedFunction<
  typeof CreateMessageService
>;

describe("resolveMetaMediaKind", () => {
  it("gives the Graph API enough time to receive a video", () => {
    expect(META_MEDIA_UPLOAD_TIMEOUT_MS).toBe(5 * 60 * 1000);
  });

  it.each([
    ["image/jpeg", "image"],
    ["image/png", "image"],
    ["audio/ogg; codecs=opus", "audio"],
    ["audio/mpeg", "audio"],
    ["video/mp4", "video"],
    ["application/pdf", "document"]
  ])("mapeia %s para %s", (mimetype, expected) => {
    expect(resolveMetaMediaKind(mimetype).kind).toBe(expected);
  });

  it.each([
    ["audio/mp3", "audio", "audio/mpeg"],
    ["image/jpg", "image", "image/jpeg"]
  ])(
    "normaliza o apelido %s que a Cloud API nao reconhece",
    (mimetype, kind, normalized) => {
      expect(resolveMetaMediaKind(mimetype)).toMatchObject({
        kind,
        mimetype: normalized
      });
    }
  );

  it.each(["image/webp", "image/gif", "audio/webm", "video/quicktime"])(
    "manda %s como documento em vez de deixar a Meta recusar o formato",
    mimetype => {
      expect(resolveMetaMediaKind(mimetype).kind).toBe("document");
    }
  );

  it("aplica o limite de tamanho de cada tipo", () => {
    expect(resolveMetaMediaKind("image/png").limit).toBe(5 * 1024 * 1024);
    expect(resolveMetaMediaKind("audio/mpeg").limit).toBe(16 * 1024 * 1024);
    expect(resolveMetaMediaKind("application/pdf").limit).toBe(
      100 * 1024 * 1024
    );
  });
});

describe("PersistMetaOutboundMessageService", () => {
  const ticket = {
    id: 55,
    companyId: 9,
    update: jest.fn()
  } as unknown as Ticket;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("grava documentMessage no dataJson para o MessagesList renderizar o PDF", async () => {
    await PersistMetaOutboundMessageService({
      wamid: "wamid.1",
      body: "boleto-ac-norte.pdf",
      ticket,
      media: {
        mediaUrl: "media/9/1/55/abc/boleto-ac-norte.pdf",
        mimetype: "application/pdf",
        filename: "boleto-ac-norte.pdf",
        kind: "document"
      }
    });

    const { messageData } = createMessage.mock.calls[0][0] as never as {
      messageData: { mediaType: string; mediaUrl: string; dataJson: string };
    };

    expect(messageData.mediaType).toBe("application");
    expect(messageData.mediaUrl).toBe("media/9/1/55/abc/boleto-ac-norte.pdf");
    expect(JSON.parse(messageData.dataJson).message.documentMessage).toEqual({
      fileName: "boleto-ac-norte.pdf",
      mimetype: "application/pdf"
    });
  });

  it("nao inventa documentMessage para imagem, que renderiza pelo mediaType", async () => {
    await PersistMetaOutboundMessageService({
      wamid: "wamid.2",
      body: "",
      ticket,
      media: {
        mediaUrl: "media/9/1/55/abc/foto.jpg",
        mimetype: "image/jpeg",
        filename: "foto.jpg",
        kind: "image"
      }
    });

    const { messageData } = createMessage.mock.calls[0][0] as never as {
      messageData: { mediaType: string; dataJson: string };
    };

    expect(messageData.mediaType).toBe("image");
    expect(JSON.parse(messageData.dataJson).message).toBeUndefined();
  });

  // O gravador do navegador nomeia o arquivo sozinho; esse nome aparecia na
  // lista de tickets como se fosse o que o atendente escreveu.
  it("resume o audio gravado na lista em vez de mostrar o nome do arquivo", async () => {
    await PersistMetaOutboundMessageService({
      wamid: "wamid.4",
      body: "",
      ticket,
      media: {
        mediaUrl: "media/9/1/55/abc/audio-record-site-1789.ogg",
        mimetype: "audio/ogg",
        filename: "audio-record-site-1789.ogg",
        kind: "audio"
      }
    });

    expect(ticket.update).toHaveBeenCalledWith({ lastMessage: "📎 Áudio" });
  });

  it("mantem o nome do documento na lista, que e o que o atendente reconhece", async () => {
    await PersistMetaOutboundMessageService({
      wamid: "wamid.5",
      body: "",
      ticket,
      media: {
        mediaUrl: "media/9/1/55/abc/boleto.pdf",
        mimetype: "application/pdf",
        filename: "boleto.pdf",
        kind: "document"
      }
    });

    expect(ticket.update).toHaveBeenCalledWith({
      lastMessage: "📎 boleto.pdf"
    });
  });

  it("mantem o contrato antigo de mensagem de texto sem midia", async () => {
    await PersistMetaOutboundMessageService({
      wamid: "wamid.3",
      body: "oi",
      ticket
    });

    const { messageData } = createMessage.mock.calls[0][0] as never as {
      messageData: {
        mediaType?: string;
        mediaUrl?: string;
        dataJson: string;
      };
    };

    expect(messageData.mediaUrl).toBeUndefined();
    expect(messageData.mediaType).toBeUndefined();
    expect(JSON.parse(messageData.dataJson)).toEqual({
      wamid: "wamid.3",
      body: "oi",
      source: "meta-cloud-api"
    });
  });
});
