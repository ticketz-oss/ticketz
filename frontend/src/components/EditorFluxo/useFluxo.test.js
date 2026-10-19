import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import useFluxo from "./useFluxo";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("react-toastify", () => ({
  toast: { info: jest.fn(), success: jest.fn(), error: jest.fn() }
}));
jest.mock("../../errors/toastError", () => jest.fn());

function EditorTeste() {
  const editor = useFluxo(1, 1);
  if (editor.carregando) return <span>Carregando</span>;
  return (
    <>
      <button
        onClick={() => editor.anexar("3", new File(["teste"], "arquivo.txt"))}
      >
        Selecionar
      </button>
      <button onClick={() => editor.anexar("3", null)}>Remover</button>
      <button onClick={editor.publicar}>Publicar</button>
      <span>{editor.alterado ? "Rascunho" : "Publicado"}</span>
    </>
  );
}
const preparar = mediaName => {
  const data = {
    version: "v1",
    name: "Fila",
    nodes: [
      {
        id: "inicio",
        kind: "inicio",
        title: "Início",
        message: "",
        position: { x: 0, y: 0 }
      },
      {
        id: "3",
        optionId: 3,
        kind: "midia",
        title: "Anexo",
        message: "",
        mediaName,
        position: { x: 300, y: 0 }
      }
    ],
    edges: [{ source: "inicio", target: "3" }]
  };
  api.get.mockResolvedValue({ data });
  api.put.mockResolvedValue({ data: { ...data, idMap: { 3: 3 } } });
  api.delete.mockResolvedValue({ data: {} });
};
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
test("selecionar e remover arquivo novo não tenta excluir mídia inexistente", async () => {
  preparar(null);
  render(<EditorTeste />);
  fireEvent.click(await screen.findByText("Selecionar"));
  fireEvent.click(screen.getByText("Remover"));
  fireEvent.click(screen.getByText("Publicar"));
  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
  await screen.findByText("Publicado");
  expect(api.delete).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});
test("remover a substituição de um anexo existente mantém a exclusão pendente", async () => {
  preparar("original.pdf");
  render(<EditorTeste />);
  fireEvent.click(await screen.findByText("Selecionar"));
  fireEvent.click(screen.getByText("Remover"));
  fireEvent.click(screen.getByText("Publicar"));
  await waitFor(() =>
    expect(api.delete).toHaveBeenCalledWith("/queue-options/3/media-upload")
  );
  await screen.findByText("Publicado");
  expect(api.post).not.toHaveBeenCalled();
});
