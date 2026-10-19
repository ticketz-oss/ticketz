import getWhatsappConnectionNumber from "../../helpers/GetWhatsappConnectionNumber";

describe("getWhatsappConnectionNumber", () => {
  it("extracts the digits from a serialized Baileys session", () => {
    expect(
      getWhatsappConnectionNumber(
        JSON.stringify({
          creds: { me: { id: "5511999999999:42@s.whatsapp.net" } }
        })
      )
    ).toBe("5511999999999");
  });

  it("accepts a session object", () => {
    expect(
      getWhatsappConnectionNumber({
        creds: { me: { id: "5511888888888@s.whatsapp.net" } }
      })
    ).toBe("5511888888888");
  });

  it.each(["", "not-json", "{}", null, undefined])(
    "returns null for an unavailable session (%p)",
    session => {
      expect(getWhatsappConnectionNumber(session)).toBeNull();
    }
  );
});
