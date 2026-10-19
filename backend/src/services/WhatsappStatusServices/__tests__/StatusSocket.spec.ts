import { serializeStatusPost } from "../StatusSocket";
import WhatsappStatusPost from "../../../models/WhatsappStatusPost";

jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));

describe("serializeStatusPost", () => {
  it("exposes updatedAt so the browser can drop stale updates, and hides server-only fields", () => {
    const updatedAt = new Date("2026-10-19T12:00:05Z");
    const serialized = serializeStatusPost({
      id: 1,
      whatsappId: 2,
      kind: "text",
      state: "published",
      audienceMode: "contact_list",
      mediaPath: "whatsapp-status/1/a.jpg",
      remoteMessageId: "ABC",
      idempotencyKey: "k",
      updatedAt
    } as unknown as WhatsappStatusPost);
    expect(serialized.updatedAt).toEqual(updatedAt);
    expect(serialized).not.toHaveProperty("mediaPath");
    expect(serialized).not.toHaveProperty("remoteMessageId");
    expect(serialized).not.toHaveProperty("idempotencyKey");
  });
});
