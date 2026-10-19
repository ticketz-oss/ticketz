import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TabelaDados from ".";
import { i18n } from "../../translate/i18n";

const contatos = [
  { id: 41, name: "Ana" },
  { id: 82, name: "Bia" }
];
const colunas = [{ accessorKey: "name", header: "Nome" }];

function Lista() {
  const [selecao, setSelecao] = useState({});
  return (
    <TabelaDados
      dados={contatos}
      colunas={colunas}
      selecao={selecao}
      aoSelecionar={setSelecao}
      acoesSelecao={linhas => (
        <output>{linhas.map(linha => linha.id).join(",")}</output>
      )}
    />
  );
}

test("seleciona os registros pelos IDs e limpa a seleção sem alterar os dados", () => {
  render(<Lista />);
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: i18n.t("visual.selecionar", { nome: "Bia" })
    })
  );
  expect(screen.getByRole("status")).toHaveTextContent("82");
  fireEvent.click(
    screen.getByRole("checkbox", { name: i18n.t("visual.selecionarPagina") })
  );
  expect(screen.getByRole("status")).toHaveTextContent("41,82");
  fireEvent.click(
    screen.getByRole("button", { name: i18n.t("visual.limpar") })
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();
});

test("respeita os limites e encaminha a paginação para a API da página", () => {
  const mudar = jest.fn();
  const { rerender } = render(
    <TabelaDados
      dados={contatos}
      colunas={colunas}
      pagina={1}
      total={42}
      proxima
      aoPaginar={mudar}
    />
  );
  expect(
    screen.getByRole("button", { name: i18n.t("visual.anterior") })
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: i18n.t("visual.proxima") })
  );
  expect(mudar).toHaveBeenCalledWith(2);
  rerender(
    <TabelaDados
      dados={contatos}
      colunas={colunas}
      pagina={3}
      total={42}
      proxima={false}
      aoPaginar={mudar}
    />
  );
  expect(
    screen.getByRole("button", { name: i18n.t("visual.proxima") })
  ).toBeDisabled();
});
