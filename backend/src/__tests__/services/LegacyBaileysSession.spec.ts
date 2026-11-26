import { BufferJSON } from "libzapitu-rf";
import { convertLegacyBaileysSession } from "../../services/WbotServices/LegacyBaileysSession";

describe("legacy Baileys session conversion", () => {
  const encoded = (value: unknown) =>
    JSON.stringify(value, BufferJSON.replacer);

  it("preserves embedded binary keys and matching stored keys", () => {
    const key = { public: Buffer.from([1, 2, 3]) };
    const result = convertLegacyBaileysSession(
      encoded({ creds: { registered: true }, keys: { preKeys: { "1": key } } }),
      [{ type: "pre-key", key: "1", value: encoded(key) }]
    );
    expect(JSON.parse(result.credentials)).toEqual({ registered: true });
    expect(result.keys).toEqual([
      { type: "pre-key", key: "1", value: encoded(key) }
    ]);
  });

  it("converts embedded historical key categories", () => {
    const result = convertLegacyBaileysSession(
      encoded({ creds: {}, keys: { sessions: { jid: { value: 1 } } } }),
      []
    );
    expect(result.keys).toEqual([
      { type: "session", key: "jid", value: encoded({ value: 1 }) }
    ]);
  });

  it("rejects conflicts and malformed data without leaking contents", () => {
    expect(() =>
      convertLegacyBaileysSession(
        encoded({ creds: {}, keys: { preKeys: { "1": { x: 1 } } } }),
        [{ type: "pre-key", key: "1", value: encoded({ x: 2 }) }]
      )
    ).toThrow("Conflicting legacy Baileys keys");
    expect(() => convertLegacyBaileysSession("{secret", [])).toThrow(
      "Malformed legacy Baileys session data"
    );
    expect(() =>
      convertLegacyBaileysSession(
        encoded({ creds: {}, keys: { unknown: {} } }),
        []
      )
    ).toThrow("Unsupported legacy Baileys key category");
  });
});
