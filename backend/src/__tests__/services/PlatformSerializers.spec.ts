import type Invoices from "../../models/Invoices";
import {
  centsToReais,
  invoiceStatus,
  normalizePlanRef,
  parseInvoiceId,
  reaisToCents
} from "../../services/PlatformServices/PlatformSerializers";

describe("Platform API boundary serializers", () => {
  it("converte dinheiro somente na borda e preserva centavos inteiros", () => {
    expect(centsToReais(18900)).toBe(189);
    expect(reaisToCents(189.99)).toBe(18999);
    expect(() => centsToReais(10.5)).toThrow(
      "Valor monetário deve ser um inteiro em centavos."
    );
  });

  it("normaliza referências de plano e ids públicos de lançamento", () => {
    expect(normalizePlanRef("Plano Profissional Ágil")).toBe(
      "plano-profissional-agil"
    );
    expect(parseInvoiceId("inv_991")).toBe(991);
    expect(parseInvoiceId("invalido")).toBe(0);
  });

  it("deriva vencido sem alterar o status interno open", () => {
    const invoice = {
      status: "open",
      dueDate: "2020-01-01"
    } as Invoices;
    expect(invoiceStatus(invoice)).toBe("vencido");
  });
});
