import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navegacao from "./Navegacao";

jest.mock("../translate/i18n", () => ({ i18n: { t: chave => chave } }));

const grupos = [
  {
    chave: "operacao",
    itens: [
      { to: "/tickets", chave: "atendimentos" },
      {
        chave: "campanhas",
        filhos: [
          { to: "/campaigns", chave: "envios" },
          { to: "/contact-lists", chave: "listas" }
        ]
      }
    ]
  }
];

it("mantém destinos e destaca a rota atual sem executar navegação ao abrir um grupo", () => {
  const aoNavegar = jest.fn();
  render(
    <MemoryRouter initialEntries={["/tickets/123"]}>
      <Navegacao grupos={grupos} expandido aoNavegar={aoNavegar} />
    </MemoryRouter>
  );
  expect(
    screen.getByRole("link", { name: "atendimentos" }).getAttribute("href")
  ).toBe("/tickets");
  expect(
    screen
      .getByRole("link", { name: "atendimentos" })
      .getAttribute("aria-current")
  ).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "campanhas" }));
  expect(aoNavegar).not.toHaveBeenCalled();
  expect(
    screen.getByRole("link", { name: "listas" }).getAttribute("href")
  ).toBe("/contact-lists");
  fireEvent.click(screen.getByRole("link", { name: "envios" }));
  expect(aoNavegar).toHaveBeenCalledTimes(1);
});

it("mantém os atalhos acessíveis com a navegação recolhida", () => {
  render(
    <MemoryRouter initialEntries={["/campaigns"]}>
      <Navegacao grupos={grupos} expandido={false} aoNavegar={() => {}} />
    </MemoryRouter>
  );
  expect(screen.getByRole("link", { name: "atendimentos" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "envios" })).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "campanhas" })
      .getAttribute("aria-expanded")
  ).toBe("true");
});
