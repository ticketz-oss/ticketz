import { formatTaxId } from "./formatTaxId";

describe("formatTaxId", () => {
  it("formata CPF enquanto há até 11 dígitos", () => {
    expect(formatTaxId("51375162000")).toBe("513.751.620-00");
  });

  it("permite o décimo segundo dígito e passa a formatar como CNPJ", () => {
    expect(formatTaxId("123456780001")).toBe("12.345.678/0001");
  });

  it("formata CNPJ completo e limita a 14 dígitos", () => {
    expect(formatTaxId("12.345.678/0001-9999")).toBe(
      "12.345.678/0001-99"
    );
  });
});
