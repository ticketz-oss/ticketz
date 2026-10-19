import { isValidMsg } from "../../services/WbotServices/wbotMessageListener";

// The listener module creates Bull queues and Redis clients on import; keep
// them off the network.
jest.mock("bull");
jest.mock("ioredis");

// Status posts of contacts arrive as status@broadcast. They must never become
// tickets, campaigns or messages.
describe("status@broadcast filter", () => {
  it("ignores status@broadcast messages so they never create tickets", () => {
    expect(
      isValidMsg({
        key: { remoteJid: "status@broadcast" },
        message: { conversation: "x" }
      })
    ).toBe(false);
    expect(
      isValidMsg({
        key: { remoteJid: "5568911111111@s.whatsapp.net" },
        message: { conversation: "x" }
      })
    ).toBe(true);
  });
});
