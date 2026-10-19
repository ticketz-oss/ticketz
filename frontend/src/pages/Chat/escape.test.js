import React from "react";
import { fireEvent, render } from "@testing-library/react";
import Chat from ".";
import useChatInterno from "./useChatInterno";

jest.mock("./useChatInterno", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@material-ui/core", () => ({ useMediaQuery: () => false }));
jest.mock("react-resizable-panels", () => ({
  Panel: ({ children }) => <div>{children}</div>,
  PanelGroup: ({ children }) => <div>{children}</div>,
  PanelResizeHandle: () => null
}));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../components/interface", () => ({
  useIdentidade: () => ({}),
  Botao: ({ children, variante, ...props }) => (
    <button {...props}>{children}</button>
  ),
  BotaoIcone: ({ titulo, children, ...props }) => (
    <button aria-label={titulo} {...props}>
      {children}
    </button>
  )
}));
jest.mock("../../components/AvatarUsuario", () => () => null);
jest.mock("../../components/Conversa/PainelMensagens", () => () => null);
jest.mock("./ChatList", () => () => null);
jest.mock("./ChatMessages", () => () => <textarea aria-label="Mensagem" />);
jest.mock(
  "./ChatModal",
  () =>
    ({ open, handleClose }) =>
      open ? (
        <div
          role="dialog"
          onKeyDown={e => e.key === "Escape" && handleClose()}
          tabIndex={-1}
        />
      ) : null
);

let chat;
beforeEach(() => {
  chat = {
    user: { id: 1 },
    conversa: { id: 7, title: "Equipe", users: [] },
    voltar: jest.fn(),
    selecionar: jest.fn()
  };
  useChatInterno.mockReturnValue(chat);
});

test.each(["keyboard", "button"])(
  "%s fecha a conversa interna selecionada",
  modo => {
    const { getByRole, getByLabelText } = render(<Chat />);
    if (modo === "keyboard")
      fireEvent.keyDown(getByRole("textbox", { name: "Mensagem" }), {
        key: "Escape"
      });
    else fireEvent.click(getByLabelText("conversa.voltar (Esc)"));
    expect(chat.voltar).toHaveBeenCalledTimes(1);
  }
);

test("Escape no modal de nova conversa não fecha a conversa atual", () => {
  const { getByRole, getByLabelText } = render(<Chat />);
  fireEvent.click(getByLabelText("conversa.nova"));
  fireEvent.keyDown(getByRole("dialog"), { key: "Escape" });
  expect(chat.voltar).not.toHaveBeenCalled();
  fireEvent.keyDown(getByRole("textbox", { name: "Mensagem" }), {
    key: "Escape"
  });
  expect(chat.voltar).toHaveBeenCalledTimes(1);
});

test("Escape sem conversa selecionada não navega", () => {
  chat.conversa = null;
  render(<Chat />);
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(chat.voltar).not.toHaveBeenCalled();
});
