import { BufferJSON, jidNormalizedUser, proto } from "libzapitu-rf";
import type { AuthenticationCreds } from "libzapitu-rf/lib/Types";
import BaileysKeys from "../../models/BaileysKeys";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

// libzapitu-rf declares key material as Uint8Array, but Node Buffers work at
// runtime. We use a local key pair type to avoid strict ArrayBufferLike typing
// issues while still producing compatible buffers.
type CompatibleKeyPair = { public: Buffer; private: Buffer };

interface DumpKeyPair {
  pubKey: { type: "Buffer"; data: string } | null;
  privKey: { type: "Buffer"; data: string } | null;
}

interface DumpSignedPreKey {
  keyId: number;
  keyPair: DumpKeyPair;
  signature: { type: "Buffer"; data: string } | null;
}

interface DumpDevice {
  registrationId?: number;
  noiseKey: DumpKeyPair | null;
  identityKey: DumpKeyPair | null;
  signedPreKey: DumpSignedPreKey | null;
  advSecretKey: { type: "Buffer"; data: string } | null;
  account: unknown;
  meJid: string | null;
  meLid: string | null;
  meDisplayName?: string | null;
  platform?: string;
}

interface DumpPreKey {
  keyId: number;
  keyPair: DumpKeyPair;
}

interface DumpIdentity {
  jid: string;
  device: number;
  identityKey: { type: "Buffer"; data: string } | null;
}

interface DumpSession {
  jid: string;
  device: number;
  session: unknown;
}

interface DumpSenderKey {
  groupId: string;
  senderJid: string;
  senderDevice: number;
  record: unknown;
}

interface DumpPrivacyToken {
  jid: string;
  token: { type: "Buffer"; data: string } | null;
  timestampMs?: number;
}

interface DumpContact {
  jid: string;
  displayName?: string;
  pushName?: string;
  verifiedName?: string;
  phoneNumber?: string;
}

export interface WhatsAppSessionDump {
  device: DumpDevice;
  preKeys: DumpPreKey[];
  identities: DumpIdentity[];
  sessions: DumpSession[];
  senderKeys: DumpSenderKey[];
  privacyTokens: DumpPrivacyToken[];
  contacts: DumpContact[];
}

function unwrapBuffer(value: unknown): Buffer | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { type?: string; data?: string };
  if (v.type === "Buffer" && typeof v.data === "string") {
    return Buffer.from(v.data, "base64");
  }
  return null;
}

function unwrapKeyPair(kp: DumpKeyPair | null): CompatibleKeyPair | null {
  if (!kp) return null;
  const pubKey = unwrapBuffer(kp.pubKey);
  const privateKey = unwrapBuffer(kp.privKey);
  if (!pubKey || !privateKey) return null;
  return { public: pubKey, private: privateKey };
}

function validateDump(dump: unknown): asserts dump is WhatsAppSessionDump {
  if (!dump || typeof dump !== "object") {
    throw new Error("Invalid dump: expected object");
  }
  const d = dump as Partial<WhatsAppSessionDump>;
  if (!d.device || typeof d.device !== "object") {
    throw new Error("Invalid dump: missing device");
  }
  if (!d.device.meJid) {
    throw new Error("Invalid dump: missing device.meJid");
  }
}

function normalizeJid(jid: string | null | undefined): string | undefined {
  if (!jid) return undefined;
  try {
    if (jid.endsWith("@c.us")) {
      return jid.replace(/@c\.us$/, "@s.whatsapp.net");
    }
    return jidNormalizedUser(jid);
  } catch {
    return jid;
  }
}

function unwrapAccount(
  account: unknown
): proto.ADVSignedDeviceIdentity | undefined {
  if (!account || typeof account !== "object") return undefined;

  const raw = account as {
    accountSignature?: unknown;
    accountSignatureKey?: unknown;
    details?: unknown;
    deviceSignature?: unknown;
  };

  const unwrapped = {
    accountSignature: unwrapBuffer(raw.accountSignature),
    accountSignatureKey: unwrapBuffer(raw.accountSignatureKey),
    details: unwrapBuffer(raw.details),
    deviceSignature: unwrapBuffer(raw.deviceSignature)
  };

  if (!unwrapped.details) return undefined;

  return proto.ADVSignedDeviceIdentity.fromObject(unwrapped);
}

function buildCreds(dump: WhatsAppSessionDump): AuthenticationCreds {
  const { device } = dump;

  const noiseKey = unwrapKeyPair(device.noiseKey);
  const signedIdentityKey = unwrapKeyPair(device.identityKey);
  const signedPreKey = device.signedPreKey
    ? {
        keyId: device.signedPreKey.keyId,
        keyPair:
          unwrapKeyPair(device.signedPreKey.keyPair) ||
          ({
            public: Buffer.alloc(0),
            private: Buffer.alloc(0)
          } as CompatibleKeyPair),
        signature:
          unwrapBuffer(device.signedPreKey.signature) || Buffer.alloc(0)
      }
    : null;

  if (!signedIdentityKey) {
    throw new Error("Invalid dump: missing identityKey");
  }
  if (!signedPreKey || !signedPreKey.signature) {
    throw new Error("Invalid dump: missing signedPreKey");
  }

  const advSecretKeyRaw = unwrapBuffer(device.advSecretKey);
  const advSecretKey = advSecretKeyRaw?.length
    ? advSecretKeyRaw.toString("base64")
    : "";

  if (!advSecretKey) {
    logger.warn(
      { whatsappId: device.registrationId },
      "Imported session has no advSecretKey; re-pairing will not be possible"
    );
  }

  const account = unwrapAccount(device.account);

  const meJid = normalizeJid(device.meJid);
  const meLid = normalizeJid(device.meLid);

  if (!meJid) {
    throw new Error("Invalid dump: could not normalize device.meJid");
  }

  const creds = {
    noiseKey: noiseKey || {
      public: Buffer.alloc(0),
      private: Buffer.alloc(0)
    },
    pairingEphemeralKeyPair: {
      public: Buffer.alloc(0),
      private: Buffer.alloc(0)
    },
    signedIdentityKey,
    signedPreKey,
    registrationId: device.registrationId || 0,
    advSecretKey,
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSyncCounter: 0,
    accountSettings: {
      unarchiveChats: false
    },
    registered: true,
    pairingCode: undefined,
    lastPropHash: undefined,
    routingInfo: undefined,
    me: {
      id: meJid,
      name: device.meDisplayName || undefined,
      lid: meLid
    },
    platform: device.platform || "web",
    account,
    signalIdentities: []
  };

  return creds as unknown as AuthenticationCreds;
}

async function saveKeys(
  whatsappId: number,
  dump: WhatsAppSessionDump
): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  dump.preKeys.forEach(preKey => {
    const keyPair = unwrapKeyPair(preKey.keyPair);
    if (!keyPair) return;
    tasks.push(
      BaileysKeys.upsert({
        whatsappId,
        type: "pre-key",
        key: preKey.keyId.toString(),
        value: JSON.stringify(keyPair, BufferJSON.replacer)
      })
    );
  });

  dump.identities.forEach(identity => {
    const identifierKey = unwrapBuffer(identity.identityKey);
    if (!identifierKey) return;
    const jid = normalizeJid(identity.jid);
    if (!jid) return;
    const value = {
      identifier: {
        name: jid,
        deviceId: identity.device
      },
      identifierKey
    };
    tasks.push(
      BaileysKeys.upsert({
        whatsappId,
        type: "signal-identity",
        key: jid,
        value: JSON.stringify(value, BufferJSON.replacer)
      })
    );
  });

  dump.sessions.forEach(session => {
    if (!session.session) return;
    const jid = normalizeJid(session.jid);
    if (!jid) return;
    const value = deepUnwrapBuffers(session.session);
    tasks.push(
      BaileysKeys.upsert({
        whatsappId,
        type: "session",
        key: `${jid}:${session.device}`,
        value: JSON.stringify(value, BufferJSON.replacer)
      })
    );
  });

  dump.senderKeys.forEach(senderKey => {
    if (!senderKey.record) return;
    const groupId = normalizeJid(senderKey.groupId) || senderKey.groupId;
    const senderJid = normalizeJid(senderKey.senderJid) || senderKey.senderJid;
    const value = deepUnwrapBuffers(senderKey.record);
    tasks.push(
      BaileysKeys.upsert({
        whatsappId,
        type: "sender-key",
        key: `${groupId}::${senderJid}:${senderKey.senderDevice}`,
        value: JSON.stringify(value, BufferJSON.replacer)
      })
    );
  });

  dump.privacyTokens.forEach(token => {
    const tokenBuffer = unwrapBuffer(token.token);
    if (!tokenBuffer) return;
    const value = {
      token: tokenBuffer,
      timestamp: token.timestampMs
        ? Math.floor(token.timestampMs / 1000).toString()
        : undefined
    };
    tasks.push(
      BaileysKeys.upsert({
        whatsappId,
        type: "contacts-tc-token",
        key: token.jid,
        value: JSON.stringify(value, BufferJSON.replacer)
      })
    );
  });

  await Promise.all(tasks);
}

function deepUnwrapBuffers(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const buf = unwrapBuffer(value);
  if (buf) return buf;
  if (Array.isArray(value)) return value.map(deepUnwrapBuffers);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.keys(value as object).forEach(k => {
      out[k] = deepUnwrapBuffers((value as Record<string, unknown>)[k]);
    });
    return out;
  }
  return value;
}

const ImportWhatsAppSessionService = async (
  whatsapp: Whatsapp,
  dump: unknown
): Promise<void> => {
  validateDump(dump);

  logger.info(
    { whatsappId: whatsapp.id, meJid: dump.device.meJid },
    "Importing WhatsApp Web session dump"
  );

  await BaileysKeys.destroy({
    where: { whatsappId: whatsapp.id }
  });

  const creds = buildCreds(dump);

  await saveKeys(whatsapp.id, dump);

  await whatsapp.update({
    session: JSON.stringify({ creds, keys: {} }, BufferJSON.replacer, 0)
  });

  logger.info(
    { whatsappId: whatsapp.id },
    "Session dump imported successfully"
  );
};

export default ImportWhatsAppSessionService;
