import { isDeepStrictEqual } from "util";
import { BufferJSON } from "libzapitu-rf";

const legacyKeyTypes: Record<string, string> = {
  preKeys: "pre-key",
  sessions: "session",
  senderKeys: "sender-key",
  appStateSyncKeys: "app-state-sync-key",
  appStateVersions: "app-state-sync-version",
  senderKeyMemory: "sender-key-memory"
};

interface LegacyKey {
  type: string;
  key: string;
  value: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseLegacyJson(value: string): unknown {
  try {
    return JSON.parse(value, BufferJSON.reviver);
  } catch {
    throw new Error("Malformed legacy Baileys session data");
  }
}

export function convertLegacyBaileysSession(
  serialized: string,
  storedKeys: LegacyKey[]
): { credentials: string | null; keys: LegacyKey[] } {
  const keys = new Map<string, LegacyKey>();
  const id = (type: string, key: string): string => JSON.stringify([type, key]);

  storedKeys.forEach(entry => {
    parseLegacyJson(entry.value);
    keys.set(id(entry.type, entry.key), entry);
  });

  if (!serialized)
    return { credentials: null, keys: Array.from(keys.values()) };

  const session = parseLegacyJson(serialized);
  if (
    !isRecord(session) ||
    !isRecord(session.creds) ||
    !isRecord(session.keys)
  ) {
    throw new Error("Malformed legacy Baileys session");
  }

  Object.entries(session.keys).forEach(([oldType, entries]) => {
    const type = legacyKeyTypes[oldType];
    if (!type || !isRecord(entries)) {
      throw new Error("Unsupported legacy Baileys key category");
    }
    Object.entries(entries).forEach(([key, value]) => {
      const existing = keys.get(id(type, key));
      if (existing) {
        const stored = parseLegacyJson(existing.value);
        if (!isDeepStrictEqual(stored, value)) {
          throw new Error("Conflicting legacy Baileys keys");
        }
      } else if (value !== null && value !== undefined) {
        keys.set(id(type, key), {
          type,
          key,
          value: JSON.stringify(value, BufferJSON.replacer)
        });
      }
    });
  });

  return {
    credentials: JSON.stringify(session.creds, BufferJSON.replacer),
    keys: Array.from(keys.values())
  };
}
