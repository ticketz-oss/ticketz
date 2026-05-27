import normalizePhone from "../../helpers/NormalizePhone";

describe("normalizePhone", () => {
  it("keeps non-Brazilian numbers unchanged for phone and wphone", () => {
    const result = normalizePhone("+1 (415) 555-2671");

    expect(result).toEqual({
      phone: "14155552671",
      wphone: "14155552671"
    });
  });

  it("keeps Brazilian 13-digit mobile phone and wphone for DDD starting with 1 or 2", () => {
    const result = normalizePhone("5511987654321");

    expect(result).toEqual({
      phone: "5511987654321",
      wphone: "5511987654321"
    });
  });

  it("converts Brazilian 13-digit mobile wphone to 12 digits for DDD starting with 3 to 9", () => {
    const result = normalizePhone("5531987654321");

    expect(result).toEqual({
      phone: "5531987654321",
      wphone: "553187654321"
    });
  });

  it("converts Brazilian 12-digit mobile into 13-digit phone and keeps wphone for DDD starting with 1 or 2", () => {
    const result = normalizePhone("551187654321");

    expect(result).toEqual({
      phone: "5511987654321",
      wphone: "5511987654321"
    });
  });

  it("converts Brazilian 12-digit mobile into 13-digit phone and 12-digit wphone for DDD starting with 3 to 9", () => {
    const result = normalizePhone("553187654321");

    expect(result).toEqual({
      phone: "5531987654321",
      wphone: "553187654321"
    });
  });

  it("keeps Brazilian 12-digit landline unchanged", () => {
    const result = normalizePhone("553123456789");

    expect(result).toEqual({
      phone: "553123456789",
      wphone: "553123456789"
    });
  });
});
