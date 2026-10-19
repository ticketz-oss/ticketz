import { EventEmitter } from "events";
import { getWbot } from "../../../libs/wbot";
import AppError from "../../../errors/AppError";
import { resolveStatusMediaPath } from "../StatusMediaService";
import { getStatusProvider } from "../providers";
import BaileysStatusProvider, {
  VERIFIED_LIBZAPITU_VERSIONS
} from "../providers/BaileysStatusProvider";
import OfficialStatusProvider from "../providers/OfficialStatusProvider";
import { StatusPublishError } from "../providers/types";

jest.mock("../../../libs/wbot", () => ({ getWbot: jest.fn() }));
jest.mock("libzapitu-rf", () => ({
  jidNormalizedUser: (jid: string) => jid.replace(/:\d+@/, "@")
}));
jest.mock("../StatusMediaService", () => ({
  resolveStatusMediaPath: jest.fn()
}));

const INSTALLED = "1.0.0-alpha.16";

const connection = (overrides = {}) =>
  ({
    id: 11,
    companyId: 7,
    apiMode: "baileys",
    status: "CONNECTED",
    ...overrides
  }) as never;

const post = (overrides = {}) =>
  ({
    id: 5,
    companyId: 7,
    whatsappId: 11,
    kind: "text",
    body: "Promo de hoje",
    backgroundColor: "#024BF4",
    font: 2,
    mediaPath: null,
    ...overrides
  }) as never;

const OWN = "5568999990000:12@s.whatsapp.net";

const mockSocket = (result: unknown, ackError?: string, emitAck = true) => {
  const ws = new EventEmitter();
  const sendMessage = jest.fn().mockImplementation(async () => {
    const id = (result as { key?: { id?: string } } | undefined)?.key?.id;
    if (id && emitAck) {
      setImmediate(() =>
        ws.emit("CB:ack,class:message", {
          attrs: { id, from: "status@broadcast", error: ackError }
        })
      );
    }
    return result;
  });
  (getWbot as jest.Mock).mockReturnValue({
    user: { id: OWN },
    sendMessage,
    ws
  });
  return sendMessage;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.WHATSAPP_STATUS_VERIFIED_LIBS = INSTALLED;
});

afterAll(() => {
  delete process.env.WHATSAPP_STATUS_VERIFIED_LIBS;
});

describe("BaileysStatusProvider", () => {
  it("disables the unverified version without an explicit test override", () => {
    delete process.env.WHATSAPP_STATUS_VERIFIED_LIBS;
    expect(VERIFIED_LIBZAPITU_VERSIONS).not.toContain(INSTALLED);
    expect(BaileysStatusProvider.capabilities(connection()).publishStatus).toBe(
      false
    );
  });

  it("reports LIB_NOT_VERIFIED when the installed version is not in VERIFIED_LIBZAPITU_VERSIONS", () => {
    const verified = VERIFIED_LIBZAPITU_VERSIONS.splice(0);
    delete process.env.WHATSAPP_STATUS_VERIFIED_LIBS;
    const caps = BaileysStatusProvider.capabilities(connection());
    expect(caps).toEqual({
      publishStatus: false,
      kinds: [],
      reason: "LIB_NOT_VERIFIED",
      manualExport: true,
      ownPostsSync: false
    });

    process.env.WHATSAPP_STATUS_VERIFIED_LIBS = " 1.0.0-alpha.15 , other ";
    expect(BaileysStatusProvider.capabilities(connection()).reason).toBe(
      "LIB_NOT_VERIFIED"
    );

    process.env.WHATSAPP_STATUS_VERIFIED_LIBS = ` 1.0.0-alpha.15 , ${INSTALLED} `;
    expect(BaileysStatusProvider.capabilities(connection())).toEqual({
      publishStatus: true,
      kinds: ["text", "image", "video"],
      reason: null,
      manualExport: false,
      ownPostsSync: false
    });
    VERIFIED_LIBZAPITU_VERSIONS.push(...verified);
  });

  it("reports DISCONNECTED for a baileys connection that is not CONNECTED", () => {
    const caps = BaileysStatusProvider.capabilities(
      connection({ status: "qrcode" })
    );
    expect(caps.publishStatus).toBe(false);
    expect(caps.reason).toBe("DISCONNECTED");
    expect(getWbot).not.toHaveBeenCalled();
  });

  it("reports OFFICIAL_API with manualExport for official connections and never calls getWbot", async () => {
    const official = connection({ apiMode: "official" });
    const provider = getStatusProvider(official);
    expect(provider).toBe(OfficialStatusProvider);
    expect(getStatusProvider(connection())).toBe(BaileysStatusProvider);

    expect(provider.capabilities(official)).toEqual({
      publishStatus: false,
      kinds: [],
      reason: "OFFICIAL_API",
      manualExport: true,
      ownPostsSync: false
    });
    await expect(provider.publish(post(), official, [])).rejects.toEqual(
      new StatusPublishError("ERR_STATUS_UNSUPPORTED", true)
    );
    // Even the Baileys adapter refuses an official connection.
    expect(BaileysStatusProvider.capabilities(official).reason).toBe(
      "OFFICIAL_API"
    );
    expect(getWbot).not.toHaveBeenCalled();
  });

  it("sends to status@broadcast with broadcast, own JID first in statusJidList, and text styling in the third argument", async () => {
    const sendMessage = mockSocket({ key: { id: "3EB0ABC" } });
    const audience = [
      "5568911111111@s.whatsapp.net",
      "5568999990000@s.whatsapp.net",
      "5568922222222@s.whatsapp.net"
    ];

    await expect(
      BaileysStatusProvider.publish(post(), connection(), audience)
    ).resolves.toEqual({ remoteMessageId: "3EB0ABC" });

    expect(getWbot).toHaveBeenCalledWith(11);
    expect(sendMessage).toHaveBeenCalledWith(
      "status@broadcast",
      { text: "Promo de hoje" },
      {
        broadcast: true,
        statusJidList: [
          "5568999990000@s.whatsapp.net",
          "5568911111111@s.whatsapp.net",
          "5568922222222@s.whatsapp.net"
        ],
        backgroundColor: "#024BF4",
        font: 2
      }
    );
  });

  it("sends image and video by absolute path with the caption", async () => {
    const sendMessage = mockSocket({ key: { id: "MEDIA1" } });
    (resolveStatusMediaPath as jest.Mock).mockReturnValue(__filename);

    await BaileysStatusProvider.publish(
      post({
        kind: "image",
        body: "Legenda",
        mediaPath: "whatsapp-status/7/a.jpg",
        backgroundColor: null,
        font: null
      }),
      connection(),
      ["5568911111111@s.whatsapp.net"]
    );
    await BaileysStatusProvider.publish(
      post({
        kind: "video",
        body: null,
        mediaPath: "whatsapp-status/7/b.mp4",
        backgroundColor: null,
        font: null
      }),
      connection(),
      ["5568911111111@s.whatsapp.net"]
    );

    expect(resolveStatusMediaPath).toHaveBeenCalledWith(
      7,
      "whatsapp-status/7/a.jpg"
    );
    expect(sendMessage.mock.calls[0][1]).toEqual({
      image: { url: __filename },
      caption: "Legenda"
    });
    expect(sendMessage.mock.calls[0][2]).toEqual({
      broadcast: true,
      statusJidList: [
        "5568999990000@s.whatsapp.net",
        "5568911111111@s.whatsapp.net"
      ]
    });
    expect(sendMessage.mock.calls[1][1]).toEqual({
      video: { url: __filename }
    });
  });

  it("refuses to send when the media file is gone, before touching the socket", async () => {
    const sendMessage = mockSocket({ key: { id: "X" } });
    (resolveStatusMediaPath as jest.Mock).mockReturnValue(
      "/nonexistent/whatsapp-status/7/a.jpg"
    );
    await expect(
      BaileysStatusProvider.publish(
        post({ kind: "image", mediaPath: "whatsapp-status/7/a.jpg" }),
        connection(),
        []
      )
    ).rejects.toEqual(new StatusPublishError("ERR_STATUS_MEDIA_INVALID", true));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("maps a send without key.id to ERR_STATUS_NO_CONFIRMATION (permanent)", async () => {
    mockSocket({ key: {} });
    const error = await BaileysStatusProvider.publish(
      post(),
      connection(),
      []
    ).catch(e => e);
    expect(error).toBeInstanceOf(StatusPublishError);
    expect(error.code).toBe("ERR_STATUS_NO_CONFIRMATION");
    expect(error.permanent).toBe(true);

    mockSocket(undefined);
    await expect(
      BaileysStatusProvider.publish(post(), connection(), [])
    ).rejects.toEqual(
      new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true)
    );
  });

  it("fails when WhatsApp rejects the stanza after sendMessage returns an id", async () => {
    mockSocket({ key: { id: "REJECTED1" } }, "479");
    await expect(
      BaileysStatusProvider.publish(post(), connection(), [])
    ).rejects.toEqual(
      new StatusPublishError("ERR_STATUS_SERVER_REJECTED", true)
    );
  });

  it("accepts a server ACK that arrives before sendMessage returns", async () => {
    const ws = new EventEmitter();
    (getWbot as jest.Mock).mockReturnValue({
      user: { id: OWN },
      ws,
      sendMessage: jest.fn().mockImplementation(async () => {
        ws.emit("CB:ack,class:message", {
          attrs: { id: "EARLY1", from: "status@broadcast" }
        });
        return { key: { id: "EARLY1" } };
      })
    });
    await expect(
      BaileysStatusProvider.publish(post(), connection(), [])
    ).resolves.toEqual({ remoteMessageId: "EARLY1" });
  });

  it("does not mark a status as sent when the server never acknowledges it", async () => {
    jest.useFakeTimers();
    try {
      mockSocket({ key: { id: "UNCONFIRMED1" } }, undefined, false);
      const publishing = BaileysStatusProvider.publish(
        post(),
        connection(),
        []
      );
      const result = expect(publishing).rejects.toEqual(
        new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true)
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(15000);
      await result;
    } finally {
      jest.useRealTimers();
    }
  });

  it("maps ERR_WAPP_NOT_INITIALIZED to ERR_STATUS_CONNECTION_UNAVAILABLE (transient)", async () => {
    (getWbot as jest.Mock).mockImplementation(() => {
      throw new AppError("ERR_WAPP_NOT_INITIALIZED");
    });
    const error = await BaileysStatusProvider.publish(
      post(),
      connection(),
      []
    ).catch(e => e);
    expect(error).toBeInstanceOf(StatusPublishError);
    expect(error.code).toBe("ERR_STATUS_CONNECTION_UNAVAILABLE");
    expect(error.permanent).toBe(false);
  });
});
