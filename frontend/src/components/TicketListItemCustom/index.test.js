import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import TicketCard from "./index";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import api from "../../services/api";
jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({})
}));
jest.mock("../../context/Tickets/TicketsContext", () => ({
  TicketsContext: require("react").createContext({})
}));
jest.mock("../../services/api", () => ({
  put: jest.fn(() => Promise.resolve())
}));
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../AvatarContato", () => () => <span>avatar</span>);
jest.mock(
  "../TicketMessagesDialog",
  () =>
    ({ open }) =>
      open ? <div>preview-dialog</div> : null
);
jest.mock("../interface", () => ({
  useIdentidade: () => ({}),
  BotaoIcone: ({ titulo, children, ...props }) => (
    <button aria-label={titulo} {...props}>
      {children}
    </button>
  )
}));
const base = {
  id: 15,
  uuid: "ticket-uuid",
  status: "open",
  contact: { name: "Natan", number: "5568999999999" },
  lastMessage: "Olá",
  updatedAt: "2026-09-13T06:00:00Z",
  user: { name: "Guilherme" },
  whatsapp: { name: "Conexão extensa de atendimento" },
  tags: [{ id: 1, name: "AC NORTE" }]
};
const select = jest.fn();
const tab = jest.fn();
function setup(ticket = base, user = { id: 1, profile: "admin" }) {
  return render(
    <MemoryRouter initialEntries={["/tickets/ticket-uuid"]}>
      <Route path="/tickets/:ticketId">
        <AuthContext.Provider value={{ user }}>
          <TicketsContext.Provider value={{ setCurrentTicket: select }}>
            <ul>
              <TicketCard ticket={ticket} setTabOpen={tab} groupActionButtons />
            </ul>
          </TicketsContext.Provider>
        </AuthContext.Provider>
      </Route>
    </MemoryRouter>
  );
}
beforeEach(() => jest.clearAllMocks());
test("selects by UUID and separates tags, assignment and action buttons", () => {
  const { container } = setup();
  expect(
    screen.getByRole("button", { name: "Natan" }).getAttribute("aria-current")
  ).toBe("page");
  expect(
    container
      .querySelector(".ticket-card-actions")
      .closest(".ticket-card-assignment")
  ).toBeNull();
  expect(container.querySelectorAll("button button")).toHaveLength(0);
  fireEvent.click(
    screen.getByRole("button", { name: "chatExperience.preview" })
  );
  expect(screen.getByText("preview-dialog")).toBeTruthy();
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Natan" }));
  expect(select).toHaveBeenCalledWith(
    expect.objectContaining({ id: 15, uuid: "ticket-uuid" })
  );
});
test("does not advance a pending ticket when accepting fails", async () => {
  api.put.mockRejectedValueOnce(new Error("offline"));
  setup({ ...base, status: "pending" });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "ticketsList.buttons.accept" })
    );
  });
  expect(tab).not.toHaveBeenCalled();
});
test("group conversations preserve sender previews and do not expose ticket actions", () => {
  setup({ ...base, isGroup: true, lastSenderName: "Ana" });
  expect(screen.getByText("Ana: Olá")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "chatExperience.close" })
  ).toBeNull();
});

test("attendants can preview and close only their own open tickets", () => {
  const { rerender } = setup(
    { ...base, user: { id: 7, name: "Atendente" } },
    { id: 7, profile: "user" }
  );

  expect(
    screen.getByRole("button", { name: "chatExperience.preview" })
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "chatExperience.close" })
  ).toBeTruthy();

  rerender(
    <MemoryRouter initialEntries={["/tickets/ticket-uuid"]}>
      <Route path="/tickets/:ticketId">
        <AuthContext.Provider value={{ user: { id: 8, profile: "user" } }}>
          <TicketsContext.Provider value={{ setCurrentTicket: select }}>
            <ul>
              <TicketCard
                ticket={{ ...base, user: { id: 7, name: "Atendente" } }}
                setTabOpen={tab}
                groupActionButtons
              />
            </ul>
          </TicketsContext.Provider>
        </AuthContext.Provider>
      </Route>
    </MemoryRouter>
  );

  expect(
    screen.queryByRole("button", { name: "chatExperience.preview" })
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "chatExperience.close" })
  ).toBeNull();
});

test("attendants can preview and close tickets that are waiting for service", () => {
  setup(
    { ...base, status: "pending", user: null, userId: null },
    { id: 8, profile: "user" }
  );

  expect(
    screen.getByRole("button", { name: "chatExperience.close" })
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "chatExperience.preview" })
  ).toBeTruthy();
});
