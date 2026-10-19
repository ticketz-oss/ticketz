import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import useRascunhoDoTicket, { chaveDoRascunho } from "./useRascunhoDoTicket";

function Compositor({ ticketId }) {
  const [inputMessage, setInputMessage] = useState("");
  useRascunhoDoTicket(ticketId, inputMessage, setInputMessage);
  return (
    <>
      <textarea
        aria-label="mensagem"
        value={inputMessage}
        onChange={evento => setInputMessage(evento.target.value)}
      />
      <button onClick={() => setInputMessage("")}>Limpar</button>
    </>
  );
}

describe("useRascunhoDoTicket", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // O caso que quebrou na prática: a tela de Prospecção grava o rascunho e
  // navega para a conversa. O compositor monta com o ticketId já definido.
  it("carrega o rascunho deixado por outra tela ao montar", () => {
    sessionStorage.setItem(chaveDoRascunho(1423), "Oi! Vi que vocês...");

    render(<Compositor ticketId={1423} />);

    expect(screen.getByLabelText("mensagem").value).toBe(
      "Oi! Vi que vocês..."
    );
  });

  it("não apaga o rascunho gravado antes da montagem", () => {
    sessionStorage.setItem(chaveDoRascunho(1423), "texto preservado");

    render(<Compositor ticketId={1423} />);

    expect(sessionStorage.getItem(chaveDoRascunho(1423))).toBe(
      "texto preservado"
    );
  });

  it("guarda o que a pessoa digita", () => {
    render(<Compositor ticketId={7} />);

    fireEvent.change(screen.getByLabelText("mensagem"), {
      target: { value: "mensagem em andamento" }
    });

    expect(sessionStorage.getItem(chaveDoRascunho(7))).toBe(
      "mensagem em andamento"
    );
  });

  it("descarta o rascunho quando o campo é esvaziado pela pessoa", () => {
    render(<Compositor ticketId={7} />);

    fireEvent.change(screen.getByLabelText("mensagem"), {
      target: { value: "algo" }
    });
    expect(sessionStorage.getItem(chaveDoRascunho(7))).toBe("algo");

    fireEvent.click(screen.getByText("Limpar"));
    expect(sessionStorage.getItem(chaveDoRascunho(7))).toBeNull();
  });

  it("não mistura o rascunho de um ticket com o de outro", () => {
    sessionStorage.setItem(chaveDoRascunho(1), "rascunho do ticket 1");

    render(<Compositor ticketId={2} />);

    expect(screen.getByLabelText("mensagem").value).toBe("");
    expect(sessionStorage.getItem(chaveDoRascunho(1))).toBe(
      "rascunho do ticket 1"
    );
  });
});
