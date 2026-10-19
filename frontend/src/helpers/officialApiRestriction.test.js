import { isOfficialApiConnection } from "./officialApiRestriction";

describe("isOfficialApiConnection", () => {
  it("is true only for a Whatsapp record connected through the Meta official API", () => {
    expect(isOfficialApiConnection({ apiMode: "official" })).toBe(true);
  });

  it("is false for a Baileys connection or a missing/partial whatsapp record", () => {
    expect(isOfficialApiConnection({ apiMode: "baileys" })).toBe(false);
    expect(isOfficialApiConnection({})).toBe(false);
    expect(isOfficialApiConnection(undefined)).toBe(false);
  });
});
