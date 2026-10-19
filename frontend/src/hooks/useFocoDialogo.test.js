import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Dialog, DialogTitle, TextField, Button } from "@material-ui/core";
import useFocoDialogo from "./useFocoDialogo";

function Editor() {
  const [aberto, definirAberto] = useState(false);
  const restaurarFoco = useFocoDialogo(aberto);
  return (
    <>
      <button onClick={() => definirAberto(true)}>Editar</button>
      <Dialog
        open={aberto}
        onClose={() => definirAberto(false)}
        aria-labelledby="titulo"
        disableRestoreFocus
        TransitionProps={{ onExited: restaurarFoco }}
      >
        <DialogTitle id="titulo">Perfil</DialogTitle>
        <TextField id="nome" autoFocus label="Nome" />
        <Button onClick={() => definirAberto(false)}>Cancelar</Button>
      </Dialog>
    </>
  );
}

it("move o foco antes de ocultar o fundo e devolve ao botão após fechar", async () => {
  const conflitos = [];
  const original = Element.prototype.setAttribute;
  const observar = jest
    .spyOn(Element.prototype, "setAttribute")
    .mockImplementation(function (nome, valor) {
      if (
        nome === "aria-hidden" &&
        valor === "true" &&
        this.contains(document.activeElement)
      ) {
        conflitos.push(this);
      }
      return original.call(this, nome, valor);
    });
  try {
    render(<Editor />);
    const editar = screen.getByRole("button", { name: "Editar" });
    editar.focus();
    fireEvent.click(editar);
    expect(screen.getByRole("dialog", { name: "Perfil" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();
    expect(editar.closest('[aria-hidden="true"]')).not.toBeNull();
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    cancelar.focus();
    fireEvent.click(cancelar);
    await waitFor(() => expect(editar).toHaveFocus());
    expect(editar.closest('[aria-hidden="true"]')).toBeNull();
    expect(conflitos).toEqual([]);
  } finally {
    observar.mockRestore();
  }
});
