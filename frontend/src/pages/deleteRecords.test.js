import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import CompaniesManager from "../components/CompaniesManager";
import Queues from "./Queues";
import Users from "./Users";
import { AuthContext } from "../context/Auth/AuthContext";
import { SocketContext } from "../context/Socket/SocketContext";
import { i18n } from "../translate/i18n";
import api from "../services/api";

jest.mock("../components/UserModal", () => () => null);
jest.mock("../components/QueueModal", () => () => null);
jest.mock("../components/ModalUsers", () => () => null);
jest.mock("../hooks/useDate", () => ({
  useDate: () => ({ dateToClient: value => value })
}));
jest.mock("../hooks/usePlans", () => () => ({
  list: jest.fn().mockResolvedValue([])
}));
jest.mock("../hooks/useCompanies", () => () => ({
  listPaginated: mockListCompanies,
  remove: mockRemoveCompany
}));
jest.mock("../services/api", () => ({
  get: jest.fn(),
  delete: jest.fn().mockResolvedValue({})
}));

const mockListCompanies = jest.fn();
const mockRemoveCompany = jest.fn().mockResolvedValue({});
const socketManager = {
  GetSocket: () => ({ on: jest.fn(), disconnect: jest.fn() })
};
const originalIntersectionObserver = window.IntersectionObserver;

beforeAll(() => {
  window.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
});

afterAll(() => {
  window.IntersectionObserver = originalIntersectionObserver;
});

beforeEach(async () => {
  await i18n.changeLanguage("en");
  jest.clearAllMocks();
  mockListCompanies.mockResolvedValue({
    companies: [
      { id: 11, name: "Company & One", subscriptionStatus: "active" }
    ],
    hasMore: false
  });
  api.get.mockImplementation(url =>
    Promise.resolve({
      data:
        url === "/queue"
          ? [{ id: 22, name: "Queue & One", color: "#000" }]
          : {
              users: [{ id: 33, name: "User & One", email: "u@example.test" }],
              hasMore: false
            }
    })
  );
});

const confirmDelete = async () => {
  const dialog = screen.getByRole("dialog");
  const button = within(dialog).getByRole("button", { name: "Delete" });
  expect(button).toBeDisabled();
  fireEvent.change(within(dialog).getByRole("textbox"), {
    target: { value: "exclude" }
  });
  await act(async () => {
    fireEvent.click(button);
  });
};

test.each([
  ["queue", Queues, "Queue & One", "Queue", "/queue/22"],
  ["user", Users, "User & One", "User", "/users/33"]
])(
  "identifies and deletes the selected %s",
  async (_, Page, name, type, url) => {
    render(
      <SocketContext.Provider value={socketManager}>
        <Page />
      </SocketContext.Provider>
    );

    const row = (await screen.findByText(name)).closest("tr");
    fireEvent.click(within(row).getAllByRole("button")[1]);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(`Delete: ${type} - ${name}`)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(`Delete this record? ${type}: "${name}"`)
    ).toBeInTheDocument();
    await confirmDelete();
    expect(api.delete).toHaveBeenCalledWith(url);
  }
);

test("identifies and deletes the selected company", async () => {
  render(
    <AuthContext.Provider value={{ handleImpersonate: jest.fn() }}>
      <CompaniesManager />
    </AuthContext.Provider>
  );

  await screen.findByText("Company & One");
  fireEvent.click(screen.getByLabelText("actions"));
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).getByText("Delete: Company - Company & One")
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText('Delete this record? Company: "Company & One"')
  ).toBeInTheDocument();
  await confirmDelete();
  expect(mockRemoveCompany).toHaveBeenCalledWith(11);
});
