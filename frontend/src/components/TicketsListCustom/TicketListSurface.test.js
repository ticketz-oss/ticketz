import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicketListSurface from "./TicketListSurface";

it("não acrescenta contornos/elevação/arredondamento à lista e preserva rolagem", () => {
  const onScroll = jest.fn();
  render(
    <TicketListSurface onScroll={onScroll}>
      <p>Nada aqui!</p>
    </TicketListSurface>
  );
  ["ticket-list-surface", "ticket-list-scroll"].forEach(id => {
    const element = screen.getByTestId(id);
    expect(element.classList.contains("MuiPaper-elevation0")).toBe(true);
    expect(element.classList.contains("MuiPaper-rounded")).toBe(false);
    expect(element.classList.contains("MuiPaper-outlined")).toBe(false);
    expect(getComputedStyle(element).borderTopWidth).toBe("0px");
  });
  fireEvent.scroll(screen.getByTestId("ticket-list-scroll"));
  expect(onScroll).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Nada aqui!")).toBeTruthy();
});

it("preserva o ocultamento das abas inativas e o conteúdo", () => {
  render(
    <TicketListSurface style={{ display: "none" }}>Pendente</TicketListSurface>
  );
  expect(screen.getByTestId("ticket-list-surface").style.display).toBe("none");
  expect(screen.getByText("Pendente")).toBeTruthy();
});
