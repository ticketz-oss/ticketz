import path from "path";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import privateFiles from "../../../config/privateFiles";
import Contact from "../../../models/Contact";
import User from "../../../models/User";
import UserQueue from "../../../models/UserQueue";
import VoiceCall from "../../../models/VoiceCall";
import {
  assertVoiceTranscriptionConfigured,
  finalizeVoiceArtifacts,
  mergeVoiceTranscript,
  voiceRecordingPath,
  voiceSpeakerName
} from "../VoiceArtifactService";
import { waCallsClient } from "../WaCallsClient";

jest.mock("../../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn()
}));
jest.mock("../../../models/VoiceCall");
jest.mock("../../../models/Contact");
jest.mock("../../../models/User");
jest.mock("../../../models/UserQueue");
jest.mock("../../MessageServices/CreateMessageService");
jest.mock("../VoiceHistoryService", () => ({
  durationLabel: jest.fn(),
  voiceMessageId: jest.fn()
}));
jest.mock("../WaCallsClient", () => ({
  waCallsClient: {
    streamCapture: jest.fn(),
    getCapture: jest.fn(),
    deleteCapture: jest.fn()
  }
}));

const getCompanySetting = GetCompanySetting as jest.MockedFunction<
  typeof GetCompanySetting
>;
const voiceCallFindByPk = VoiceCall.findByPk as jest.MockedFunction<
  typeof VoiceCall.findByPk
>;
const voiceCallFindOne = VoiceCall.findOne as jest.MockedFunction<
  typeof VoiceCall.findOne
>;
const voiceCallUpdate = VoiceCall.update as jest.MockedFunction<
  typeof VoiceCall.update
>;
const userQueueFindOne = UserQueue.findOne as jest.MockedFunction<
  typeof UserQueue.findOne
>;
const streamCapture = waCallsClient.streamCapture as jest.MockedFunction<
  typeof waCallsClient.streamCapture
>;

describe("Groq voice transcription credentials", () => {
  beforeEach(() => {
    process.env.VOICE_TRANSCRIPTION_PROVIDER = "groq";
    delete process.env.GROQ_API_KEY;
    getCompanySetting.mockImplementation(async (_companyId, key) =>
      key === "openAiKey" ? "openai-key-must-not-be-reused" : ""
    );
  });

  afterEach(() => {
    delete process.env.VOICE_TRANSCRIPTION_PROVIDER;
    delete process.env.GROQ_API_KEY;
  });

  it("requires GROQ_API_KEY instead of reusing a tenant OpenAI key", async () => {
    await expect(assertVoiceTranscriptionConfigured(1)).rejects.toThrow(
      "ERR_VOICE_TRANSCRIPTION_NOT_CONFIGURED"
    );
    expect(getCompanySetting).not.toHaveBeenCalledWith(1, "openAiKey", "");
  });

  it("accepts the Groq key from the process environment", async () => {
    process.env.GROQ_API_KEY = "groq-test-key";
    await expect(
      assertVoiceTranscriptionConfigured(1)
    ).resolves.toBeUndefined();
  });
});

describe("voice transcription presentation", () => {
  it("uses saved names and falls back to Usuário for numeric contacts", () => {
    const attendant = { name: "Atendente Ana" } as User;
    expect(
      voiceSpeakerName("customer", { name: "Cliente Maria" } as Contact, null)
    ).toBe("Cliente Maria");
    expect(
      voiceSpeakerName("customer", { name: "5511999999999" } as Contact, null)
    ).toBe("Usuário");
    expect(voiceSpeakerName("agent", null, attendant)).toBe("Atendente Ana");
  });

  it("orders both speakers by timestamp and formats the transcript", () => {
    const result = mergeVoiceTranscript(
      [{ start: 4.2, end: 5, speaker: "Atendente Ana", text: "Olá" }],
      [{ start: 1.1, end: 2, speaker: "Cliente Maria", text: "Alô" }]
    );
    expect(result.segments.map(segment => segment.speaker)).toEqual([
      "Cliente Maria",
      "Atendente Ana"
    ]);
    expect(result.transcript).toBe(
      "[00:01] Cliente Maria: Alô\n[00:04] Atendente Ana: Olá"
    );
  });
});

describe("private voice recording access", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows the call owner and resolves only inside private storage", async () => {
    voiceCallFindOne.mockResolvedValue({
      userId: 10,
      recordingUrl: "voice/1/77.wav"
    } as VoiceCall);

    await expect(voiceRecordingPath(77, 1, 10, "user")).resolves.toBe(
      path.join(privateFiles.directory, "voice/1/77.wav")
    );
  });

  it("denies an unassigned user and rejects path traversal", async () => {
    voiceCallFindOne.mockResolvedValueOnce({
      userId: 10,
      queueIds: [2],
      recordingUrl: "voice/1/77.wav"
    } as VoiceCall);
    userQueueFindOne.mockResolvedValue(null);
    await expect(voiceRecordingPath(77, 1, 11, "user")).resolves.toBeNull();

    voiceCallFindOne.mockResolvedValueOnce({
      userId: 10,
      recordingUrl: "../../etc/passwd"
    } as VoiceCall);
    await expect(voiceRecordingPath(77, 1, 10, "user")).resolves.toBeNull();
  });
});

describe("artifact processing claim", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not process a call already claimed by another worker", async () => {
    voiceCallFindByPk.mockResolvedValue({
      id: 77,
      recordingEnabled: true,
      transcriptionEnabled: false,
      artifactStatus: "capturing"
    } as VoiceCall);
    voiceCallUpdate.mockResolvedValue([0] as never);

    await finalizeVoiceArtifacts(77);

    expect(streamCapture).not.toHaveBeenCalled();
  });
});
