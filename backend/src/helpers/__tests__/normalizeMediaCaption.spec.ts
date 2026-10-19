import normalizeMediaCaption from "../normalizeMediaCaption";

describe("normalizeMediaCaption", () => {
  it("preserva a legenda e remove apenas espacos externos", () => {
    expect(normalizeMediaCaption("  *Agente:*\nSegue o arquivo  ")).toBe(
      "*Agente:*\nSegue o arquivo"
    );
  });

  it("ignora payloads multipart ambiguos em vez de enviar texto incorreto", () => {
    expect(normalizeMediaCaption(["arquivo.pdf", "legenda"])).toBe("");
    expect(normalizeMediaCaption(undefined)).toBe("");
  });
});
