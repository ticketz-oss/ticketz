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
      encoded({
        creds: { registered: true },
        keys: { sessions: { jid: { value: 1 } } }
      }),
      []
    );
    expect(result.keys).toEqual([
      { type: "session", key: "jid", value: encoded({ value: 1 }) }
    ]);
  });

  it("preserves stored key values without parsing them", () => {
    const storedKey = {
      type: "pre-key",
      key: "1",
      value: "opaque legacy value"
    };
    const result = convertLegacyBaileysSession(
      encoded({
        creds: { registered: true },
        keys: { preKeys: { "1": { x: 1 } } }
      }),
      [storedKey]
    );
    expect(result.keys).toEqual([storedKey]);
  });

  it("rejects malformed or unsupported serialized sessions", () => {
    expect(() => convertLegacyBaileysSession("{secret", [])).toThrow(
      "Malformed legacy Baileys session data"
    );
    expect(() =>
      convertLegacyBaileysSession(
        encoded({ creds: { registered: true }, keys: { unknown: {} } }),
        []
      )
    ).toThrow("Unsupported legacy Baileys key category");
    expect(() =>
      convertLegacyBaileysSession(encoded({ creds: {}, keys: {} }), [])
    ).toThrow("Malformed legacy Baileys session");
  });
});
