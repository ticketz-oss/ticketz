import VoiceCall from "../../../models/VoiceCall";
import VoiceConnection from "../../../models/VoiceConnection";
import UserQueue from "../../../models/UserQueue";
import { waCallsClient } from "../WaCallsClient";
import { acceptVoiceCall } from "../VoiceService";

let transactionQueue: Promise<unknown> = Promise.resolve();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(callback => {
      const run = transactionQueue.then(() =>
        callback({ LOCK: { UPDATE: "UPDATE" } })
      );
      transactionQueue = run.catch(() => undefined);
      return run;
    })
  }
}));
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
    acceptCall: jest.fn().mockResolvedValue(undefined)
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

const voiceCallFindOne = VoiceCall.findOne as jest.MockedFunction<
  typeof VoiceCall.findOne
>;
const connectionFindByPk = VoiceConnection.findByPk as jest.MockedFunction<
  typeof VoiceConnection.findByPk
>;
const userQueueFindOne = UserQueue.findOne as jest.MockedFunction<
  typeof UserQueue.findOne
>;
const userQueueFindAll = UserQueue.findAll as jest.MockedFunction<
  typeof UserQueue.findAll
>;

describe("atomic voice call acceptance", () => {
  beforeEach(() => {
    transactionQueue = Promise.resolve();
    process.env.WACALLS_TOKEN_SECRET =
      "test-only-media-secret-with-at-least-thirty-two-characters";
  });

  afterAll(() => {
    delete process.env.WACALLS_TOKEN_SECRET;
  });

  it("allows exactly one of two attendants to claim the ringing call", async () => {
    const call = {
      id: 77,
      externalCallId: "upstream-77",
      companyId: 1,
      voiceConnectionId: 4,
      whatsappId: 3,
      queueId: 2,
      queueIds: [2],
      userId: null,
      number: "5511999999999",
      state: "ringing",
      startedAt: new Date(),
      acceptedAt: null,
      endedAt: null,
      durationSeconds: 0,
      error: null,
      update: jest.fn(async values => Object.assign(call, values)),
      reload: jest.fn(async () => call)
    } as unknown as VoiceCall;
    voiceCallFindOne.mockImplementation(async () => call);
    userQueueFindOne.mockResolvedValue({} as UserQueue);
    userQueueFindAll.mockResolvedValue([]);
    connectionFindByPk.mockResolvedValue({
      sessionId: "session-4"
    } as VoiceConnection);

    const results = await Promise.allSettled([
      acceptVoiceCall(77, { id: 10, companyId: 1 }),
      acceptVoiceCall(77, { id: 11, companyId: 1 })
    ]);

    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(
      1
    );
    expect(call.userId).toBe(10);
    expect(waCallsClient.acceptCall).toHaveBeenCalledTimes(1);
    expect(voiceCallFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
  });
});
