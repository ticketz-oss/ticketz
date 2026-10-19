import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import Ticket from ".";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({ user: { queues: [] } })
}));
jest.mock("../../context/Socket/SocketContext", () => ({
  SocketContext: require("react").createContext({
    GetSocket: () => ({ on: jest.fn(), disconnect: jest.fn() }),
    onConnect: jest.fn()
  })
}));
jest.mock("../../hooks/useSettings", () => () => ({
  getSetting: () => new Promise(() => {})
}));
jest.mock("../interface", () => ({
  useIdentidade: () => ({}),
  BotaoIcone: ({ titulo, children, ...props }) => (
    <button aria-label={titulo} {...props}>
      {children}
    </button>
  )
}));
jest.mock("../ContactDrawer", () => () => null);
jest.mock("../Conversa/CompositorAtendimento", () => () => null);
jest.mock("../Conversa/PainelMensagens", () => () => null);
jest.mock("../TicketHeader", () => ({ children }) => (
  <header>{children}</header>
));
jest.mock("../TicketInfo", () => () => null);
jest.mock("../TicketActionButtonsCustom", () => () => null);
jest.mock("../MessagesList", () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn(() => ({ matches: false }));
});

test.each(["keyboard", "button"])(
  "%s retorna à lista sem finalizar o atendimento",
  modo => {
    const history = createMemoryHistory({
      initialEntries: ["/tickets/uuid-123"]
    });
    const { getByLabelText } = render(
      <Router history={history}>
        <Route path="/tickets/:ticketId">
          <Ticket />
        </Route>
      </Router>
    );
    if (modo === "keyboard")
      fireEvent.keyDown(document.body, { key: "Escape" });
    else fireEvent.click(getByLabelText("conversa.voltar (Esc)"));
    expect(history.location.pathname).toBe("/tickets");
    expect(api.put).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  }
);
