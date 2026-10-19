import { podeVerProspeccao } from "./prospeccao";

describe("podeVerProspeccao", () => {
  it("libera admin do tenant dono da ferramenta", () => {
    expect(
      podeVerProspeccao({ profile: "admin", company: { slug: "teste" } })
    ).toBe(true);
  });

  it("libera super mesmo sem perfil admin", () => {
    expect(
      podeVerProspeccao({
        profile: "user",
        super: true,
        company: { slug: "teste" }
      })
    ).toBe(true);
  });

  it("bloqueia atendente comum do tenant dono", () => {
    expect(
      podeVerProspeccao({ profile: "user", company: { slug: "teste" } })
    ).toBe(false);
  });

  it("bloqueia outros tenants", () => {
    expect(
      podeVerProspeccao({ profile: "admin", company: { slug: "acnorte" } })
    ).toBe(false);
  });

  it("ignora caixa e espaços no slug", () => {
    expect(
      podeVerProspeccao({ profile: "admin", company: { slug: "  TESTE " } })
    ).toBe(true);
  });

  it("não quebra com usuário ou empresa ausentes", () => {
    expect(podeVerProspeccao(undefined)).toBe(false);
    expect(podeVerProspeccao({ profile: "admin" })).toBe(false);
  });
});
