import React, { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import FerramentasBarra from "./FerramentasBarra";
import useFecharConversaComEscape from "../hooks/useFecharConversaComEscape";

jest.mock("../translate/i18n", () => ({ i18n: { t: key => key } }));

function Conversa({ fechar, assinatura, cancelar }) {
  useFecharConversaComEscape(fechar);
  return (
    <>
      <textarea aria-label="Mensagem" />
      <FerramentasBarra>
        <Avisos assinatura={assinatura} cancelar={cancelar} />
      </FerramentasBarra>
    </>
  );
}

function Avisos({ assinatura, cancelar }) {
  useEffect(() => {
    assinatura();
    return cancelar;
  }, [assinatura, cancelar]);
  return <button>Avisos</button>;
}

test("toolbar fechada não consome Escape; aberta fecha antes da conversa e mantém assinaturas", () => {
  jest.useFakeTimers();
  const fechar = jest.fn();
  const assinatura = jest.fn();
  const cancelar = jest.fn();
  const { unmount } = render(
    <Conversa fechar={fechar} assinatura={assinatura} cancelar={cancelar} />
  );
  expect(assinatura).toHaveBeenCalledTimes(1);
  const campo = screen.getByRole("textbox");
  fireEvent.keyDown(campo, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(1);

  const gatilho = screen.getByRole("button", { name: "visual.ferramentas" });
  gatilho.getBoundingClientRect = () => ({
    x: 10,
    y: 10,
    top: 10,
    left: 10,
    right: 50,
    bottom: 50,
    width: 40,
    height: 40
  });
  fireEvent.click(gatilho);
  const dialogo = screen.getByRole("dialog");
  fireEvent.keyDown(dialogo, { key: "Escape" });
  act(() => jest.runAllTimers());
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(fechar).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(campo, { key: "Escape" });
  expect(fechar).toHaveBeenCalledTimes(2);

  fireEvent.click(gatilho);
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(assinatura).toHaveBeenCalledTimes(1);
  expect(cancelar).not.toHaveBeenCalled();
  unmount();
  expect(cancelar).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
