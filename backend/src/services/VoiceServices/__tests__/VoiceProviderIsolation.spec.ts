import Whatsapp from "../../../models/Whatsapp";
import VoiceConnection from "../../../models/VoiceConnection";
import { waCallsClient } from "../WaCallsClient";
import { pairVoiceConnection, listVoiceConnections } from "../VoiceService";

jest.mock("../../../database", () => ({ __esModule: true, default: {} }));
jest.mock("../../../models/VoiceCall");
jest.mock("../../../models/VoiceConnection");
jest.mock("../../../models/UserQueue");
jest.mock("../../../models/UserSocketSession");
jest.mock("../../../models/User");
jest.mock("../../../models/Whatsapp");
jest.mock("../../../models/WhatsappQueue");
jest.mock("../../../libs/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) })
}));
jest.mock("../VoiceAccessService", () => ({
  assertVoiceEnabled: jest.fn().mockResolvedValue(undefined),
  voiceEnabledForCompany: jest.fn().mockResolvedValue(true),
  voiceGloballyEnabled: jest.fn().mockReturnValue(true)
}));
jest.mock("../WaCallsClient", () => ({
  waCallsClient: {
    createSession: jest.fn(),
    health: jest.fn().mockResolvedValue(true)
  }
}));
jest.mock("../VoiceHistoryService", () => ({
  startVoiceHistory: jest.fn(async call => call),
  finishVoiceHistory: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../VoiceArtifactService", () => ({
  assertVoiceTranscriptionConfigured: jest.fn().mockResolvedValue(undefined),
  finalizeVoiceArtifacts: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../VoiceContactService", () => ({
  resolveVoiceContact: jest.fn()
}));

it("rejects QR voice pairing on an official connection before creating any session", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 3,
    companyId: 1,
    apiMode: "official"
  });
  await expect(pairVoiceConnection(1, 3, true)).rejects.toMatchObject({
    message: "ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED"
  });
  expect(VoiceConnection.findOrCreate).not.toHaveBeenCalled();
  expect(waCallsClient.createSession).not.toHaveBeenCalled();
});

it("offers only Baileys connections for voice QR pairing", async () => {
  (VoiceConnection.findAll as jest.Mock).mockResolvedValue([]);
  (Whatsapp.findAll as jest.Mock).mockResolvedValue([]);
  await listVoiceConnections(1);
  expect(Whatsapp.findAll).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { companyId: 1, channel: "whatsapp", apiMode: "baileys" }
    })
  );
});
