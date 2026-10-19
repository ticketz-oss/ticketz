import { GetCompanySetting } from "../../../helpers/CheckSettings";
import { voiceEnabledForCompany } from "../../VoiceServices/VoiceAccessService";
import wbotMonitor from "../wbotMonitor";

jest.mock("../../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn().mockResolvedValue("en")
}));
jest.mock("../../VoiceServices/VoiceAccessService", () => ({
  voiceEnabledForCompany: jest.fn()
}));
jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../BaileysServices/CreateOrUpdateBaileysService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../MessageServices/CreateMessageService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../TranslationServices/i18nService", () => ({
  _t: jest.fn((message: string) => message)
}));
jest.mock("../../../libs/cache", () => ({
  cacheLayer: { del: jest.fn() }
}));

describe("wbotMonitor experimental voice coexistence", () => {
  it("does not send the legacy calls-disabled auto-reply for an enabled tenant", async () => {
    const handlers: Record<string, (node: unknown) => Promise<void>> = {};
    const sendMessage = jest.fn();
    const wbot = {
      id: 5,
      ws: {
        on: jest.fn(
          (event: string, handler: (node: unknown) => Promise<void>) => {
            handlers[event] = handler;
          }
        )
      },
      ev: { on: jest.fn() },
      sendMessage
    };
    (
      voiceEnabledForCompany as jest.MockedFunction<
        typeof voiceEnabledForCompany
      >
    ).mockResolvedValue(true);
    (
      GetCompanySetting as jest.MockedFunction<typeof GetCompanySetting>
    ).mockClear();

    await wbotMonitor(wbot as never, { id: 5 } as never, 1);
    await handlers["CB:call"]({
      attrs: { from: "5511999999999@s.whatsapp.net" },
      content: [{ tag: "terminate", attrs: { "call-id": "call-1" } }]
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(GetCompanySetting).not.toHaveBeenCalled();
  });
});
