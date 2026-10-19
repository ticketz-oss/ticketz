import { shouldApplyQueueFilter } from "../TicketQueueAccess";

describe("ListTicketsService: visibilidade de filas", () => {
  it("não esconde atendimentos do administrador quando nenhuma fila foi vinculada", () => {
    expect(shouldApplyQueueFilter("admin", [])).toBe(false);
  });

  it("mantém a seleção explícita de filas do administrador", () => {
    expect(shouldApplyQueueFilter("admin", [1, 3])).toBe(true);
  });

  it("mantém o bloqueio por fila para usuário comum, inclusive sem filas", () => {
    expect(shouldApplyQueueFilter("user", [])).toBe(true);
    expect(shouldApplyQueueFilter("user", [2])).toBe(true);
  });
});
