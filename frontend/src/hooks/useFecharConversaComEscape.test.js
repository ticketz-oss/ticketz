import React from "react";
import { fireEvent, render } from "@testing-library/react";
import useFecharConversaComEscape from "./useFecharConversaComEscape";

function Conversa({ fechar, ativa = true, children }) {
  useFecharConversaComEscape(fechar, ativa);
  return <div>{children || <textarea aria-label="Mensagem" />}</div>;
}

test("Escape fecha a conversa inclusive durante digitação, sem alterar o rascunho", () => {
  const fechar = jest.fn();
  const { getByRole } = render(<Conversa fechar={fechar} />);
  const input = getByRole("textbox");
  fireEvent.change(input, { target: { value: "mensagem não enviada" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
  expect(input.value).toBe("mensagem não enviada");
});

test.each([
  { key: "Enter" },
  { key: "Escape", isComposing: true },
  { key: "Escape", keyCode: 229 },
  { key: "Escape", repeat: true },
  { key: "Escape", ctrlKey: true },
  { key: "Escape", altKey: true },
  { key: "Escape", metaKey: true },
  { key: "Escape", shiftKey: true }
])("não navega com evento reservado %j", evento => {
  const fechar = jest.fn();
  const { getByRole } = render(<Conversa fechar={fechar} />);
  fireEvent.keyDown(getByRole("textbox"), evento);
  expect(fechar).not.toHaveBeenCalled();
});

test("respeita preventDefault e stopPropagation do campo", () => {
  const fechar = jest.fn();
  const { getByRole, rerender } = render(
    <Conversa fechar={fechar}>
      <textarea onKeyDown={e => e.preventDefault()} />
    </Conversa>
  );
  fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
  rerender(
    <Conversa fechar={fechar}>
      <textarea onKeyDown={e => e.stopPropagation()} />
    </Conversa>
  );
  fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
  expect(fechar).not.toHaveBeenCalled();
});

test.each([
  { role: "dialog" },
  { role: "alertdialog" },
  { role: "menu" },
  { role: "listbox" },
  { className: "MuiModal-root" },
  { className: "emoji-mart" },
  { "data-conversation-escape-layer": true },
  { "data-conversation-escape-block": true },
  { role: "combobox", "aria-expanded": true, "aria-controls": "opcoes" }
])("camada aberta recebe o Escape sem fechar a conversa %j", props => {
  const fechar = jest.fn();
  const { getByRole } = render(
    <Conversa fechar={fechar}>
      <textarea />
      <div {...props} />
    </Conversa>
  );
  fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
  expect(fechar).not.toHaveBeenCalled();
});

test("o mesmo Escape não fecha a conversa depois de remover um diálogo", () => {
  const fechar = jest.fn();
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog");
  document.body.appendChild(modal);
  const { getByRole } = render(
    <Conversa fechar={fechar}>
      <textarea onKeyDown={() => modal.remove()} />
    </Conversa>
  );
  fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
  expect(fechar).not.toHaveBeenCalled();
  fireEvent.keyDown(getByRole("textbox"), { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
});

test("seções expandidas do contato não impedem fechar a conversa", () => {
  const fechar = jest.fn();
  render(
    <Conversa fechar={fechar}>
      <button aria-expanded="true" aria-controls="contato">
        Contato
      </button>
      <section id="contato">Informações</section>
    </Conversa>
  );
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
});

test("ignora popover Radix fechado e seus menus forceMount, mas protege quando aberto", () => {
  const fechar = jest.fn();
  const camada = estado => (
    <Conversa fechar={fechar}>
      <div role="dialog" data-state={estado} className="barra-ferramentas">
        <ul role="menu">
          <li role="menuitem">Agendamento</li>
        </ul>
      </div>
    </Conversa>
  );
  const { rerender } = render(camada("closed"));
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
  rerender(camada("open"));
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
});

test("ignora camadas ocultas e remove listeners ao desmontar ou desativar", () => {
  const fechar = jest.fn();
  const { rerender, unmount } = render(
    <Conversa fechar={fechar}>
      <div hidden>
        <div role="dialog" />
      </div>
      <div style={{ display: "none" }}>
        <div role="menu" />
      </div>
      <div aria-hidden="true">
        <div role="listbox" />
      </div>
    </Conversa>
  );
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
  rerender(<Conversa fechar={fechar} ativa={false} />);
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
  rerender(<Conversa fechar={fechar} />);
  unmount();
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);
});
