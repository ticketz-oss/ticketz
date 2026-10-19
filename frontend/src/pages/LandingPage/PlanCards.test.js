import React from "react";
import { render, screen, within } from "@testing-library/react";
import { Plans } from "./Experience";

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

const mockPlans = [
  { id: 2, name: "Básico", value: 200, users: 15, connections: 15, queues: 20 },
  { id: 3, name: "IA", value: 300, users: 30, connections: 15, queues: 30 },
  {
    id: 4,
    name: "Enterprise",
    value: 1000,
    users: 100,
    connections: 20,
    queues: 50
  }
];

jest.mock("./plans", () => {
  const actual = jest.requireActual("./plans");
  return {
    ...actual,
    usePublicPlans: () => ({
      plans: actual.classifyPlans(mockPlans),
      status: "ready"
    })
  };
});

test("plans follow the growth path from Básico to Enterprise", () => {
  render(<Plans />);
  const cards = screen.getAllByRole("article");
  expect(
    cards.map(
      card => within(card).getByRole("heading", { level: 3 }).textContent
    )
  ).toEqual(["Básico", "IA", "Enterprise"]);
  expect(
    cards.map(card => card.querySelector(".lpx-plan-phase").textContent)
  ).toEqual(["Para começar", "Para crescer", "Para escalar"]);
});

test("Enterprise shows what only it includes", () => {
  render(<Plans />);
  const enterprise = screen.getByRole("article", { name: "Enterprise" });
  expect(within(enterprise).getByText("Mais completo")).toBeTruthy();
  expect(
    within(enterprise).getByText("Desenvolvimento sob medida")
  ).toBeTruthy();
  expect(within(enterprise).getByText("Suporte prioritário")).toBeTruthy();
  expect(within(enterprise).getByText("Implantação assistida")).toBeTruthy();
  expect(
    within(enterprise)
      .getByRole("link", { name: /Testar Enterprise grátis/ })
      .getAttribute("href")
  ).toBe("/assinar?plano=4");
});

test("Enterprise offers a specialist only when a WhatsApp number exists", () => {
  const { rerender } = render(<Plans />);
  expect(
    screen.queryByRole("link", { name: /Falar com um especialista/ })
  ).toBeNull();
  rerender(<Plans whatsappNumber="5511912345678" />);
  const link = screen.getByRole("link", { name: /Falar com um especialista/ });
  expect(link.getAttribute("href")).toMatch(
    /^https:\/\/wa\.me\/5511912345678\?text=/
  );
});

test("comparison table lists capacity and Enterprise-only services per plan", () => {
  render(<Plans />);
  const table = screen.getByRole("table", { name: "Compare os planos" });
  const usersRow = within(table).getByRole("row", { name: /Usuários/ });
  expect(
    within(usersRow)
      .getAllByRole("cell")
      .map(cell => cell.textContent)
  ).toEqual(["15", "30", "100"]);
  const aiRow = within(table).getByRole("row", { name: /IA para a equipe/ });
  expect(aiRow.textContent.replace(/ /g, " ")).toContain(
    "Pacotes a partir de R$ 19,90"
  );
  const customRow = within(table).getByRole("row", {
    name: /Desenvolvimento sob medida/
  });
  expect(
    within(customRow)
      .getAllByRole("cell")
      .map(cell => cell.getAttribute("aria-label"))
  ).toEqual(["Não incluso", "Não incluso", "Incluso"]);
  const flowsRow = within(table).getByRole("row", {
    name: /Editor visual de fluxos/
  });
  expect(
    within(flowsRow)
      .getAllByRole("cell")
      .map(cell => cell.getAttribute("aria-label"))
  ).toEqual(["Incluso", "Incluso", "Incluso"]);
});

const plain = node => node.textContent.replace(/ /g, " ");

test("Enterprise frames its price as value over the plan below it", () => {
  render(<Plans />);
  const enterprise = plain(screen.getByRole("article", { name: "Enterprise" }));
  expect(enterprise).toContain("R$ 10,00 por usuário/mês");
  expect(enterprise).toContain(
    "Por + R$ 700,00/mês em relação ao IA, você também leva:"
  );
  expect(enterprise).toContain("100 usuários+70");
  expect(enterprise).toContain("O teste é grátis em qualquer plano.");
});

test("smaller plans point to the Enterprise cost per user", () => {
  render(<Plans />);
  expect(plain(screen.getByRole("article", { name: "Básico" }))).toContain(
    "cada usuário sai por R$ 10,00/mês, menos que neste plano"
  );
  expect(plain(screen.getByRole("article", { name: "IA" }))).toContain(
    "cada usuário custa o mesmo"
  );
});

test("smaller plans show the Enterprise services they do not include", () => {
  render(<Plans />);
  const basic = screen.getByRole("article", { name: "Básico" });
  expect(within(basic).getByText("Disponível no Enterprise")).toBeTruthy();
  expect(plain(basic)).toContain(
    "Não incluso neste plano: Desenvolvimento sob medida"
  );
});
