import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Summary from "./Summary";

jest.mock("../../services/config", () => ({ getBackendURL: () => "" }));
jest.mock("../../translate/i18n", () => {
  const instance = require("i18next").createInstance();
  instance.init({
    initImmediate: false,
    lng: "pt",
    ns: ["translations"],
    defaultNS: "translations",
    resources: require("../../translate/languages/pt").messages
  });
  return { i18n: instance };
});

const enterprise = {
  name: "Enterprise",
  tier: "enterprise",
  value: 1000,
  aiIncluded: true,
  currency: "BRL"
};
const markup = props =>
  renderToStaticMarkup(
    <Summary
      plan={enterprise}
      mode="unofficial"
      dueDay={5}
      onEdit={() => {}}
      {...props}
    />
  ).replace(/\u00a0/g, " ");

describe("checkout summary", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-08T18:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("renders the due date as readable text instead of double-escaped HTML entities", () => {
    const html = markup();
    expect(html).toContain('<time dateTime="2026-11-05">05/11/2026</time>');
    expect(html).not.toContain("&amp;#x2F;");
    expect(html).not.toContain("&#x2F;");
  });
  it("charges the first invoice on the last trial day, only for the days used", () => {
    const html = markup();
    // 2026-10-08 + 7 days = 15/10; prorated up to the due day 05/11.
    expect(html).toContain("Primeira cobrança, no fim do teste");
    expect(html).toContain('<time dateTime="2026-10-15">15/10/2026</time>');
    expect(html).toContain("Proporcional a 21 dias de uso");
    expect(html).toContain("R$ 681,72");
    expect(html).toContain("Mensalidade cheia a partir de");
  });
  it("distinguishes the free trial total from the future monthly price", () => {
    const html = markup();
    expect(html).toContain("Total hoje");
    expect(html).toContain("R$ 0,00");
    expect(html).toContain("Mensalidade após o teste");
    expect(html).toContain("R$ 1.000,00");
    expect(html).toContain("Sem cartão. Sem pagamento agora.");
  });
  it("lists the Enterprise-only services only for Enterprise", () => {
    expect(markup()).toContain("Desenvolvimento sob medida");
    expect(markup()).toContain("Suporte prioritário");
    expect(
      markup({
        plan: { ...enterprise, tier: "ai", name: "IA", value: 300 }
      })
    ).not.toContain("Desenvolvimento sob medida");
  });
  it("adds the selected AI package only when the plan does not include AI", () => {
    expect(
      markup({
        plan: {
          name: "Básico",
          tier: "basic",
          value: 200,
          aiIncluded: false,
          currency: "BRL"
        },
        aiAddon: "equipe"
      })
    ).toContain("R$ 239,90");
    expect(markup({ aiAddon: "equipe" })).toContain("R$ 1.000,00");
  });
  it("keeps custom plan names safe and makes Meta fees visible for official connections", () => {
    const html = markup({
      plan: {
        ...enterprise,
        tier: "custom",
        name: "<script>alert(1)</script>"
      },
      mode: "official"
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain(
      "Na API oficial, as mensagens são cobradas pela Meta, à parte."
    );
  });
  it("does not present a free monthly plan while no plan has been chosen", () => {
    const html = markup({ plan: null, mode: null });
    expect(html).toContain("Escolha seu plano");
    expect(html).toContain("Selecione uma conexão");
    expect(html).not.toContain('aria-label="Alterar plano"');
    expect(html).not.toContain('aria-label="Alterar vencimento"');
  });
});
