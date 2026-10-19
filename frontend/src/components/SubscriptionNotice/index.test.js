import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubscriptionNotice from ".";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

jest.mock("lucide-react", () => ({ AlertCircle: () => null, X: () => null }));
jest.mock("../../services/api", () => ({ get: jest.fn() }));
jest.mock("../../translate/i18n", () => ({
  i18n: { t: (key, options) => `${key}${options?.count || ""}` }
}));

const response = (
  billingDay = "2026-09-25",
  notice = { invoiceId: 18, severity: "warning", remainingDays: 6 }
) => ({ data: { billingDay, notice } });
const show = (profile = "admin") =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: { id: 7, companyId: 9, profile } }}>
        <SocketContext.Provider value={null}>
          <SubscriptionNotice />
        </SocketContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  api.get.mockResolvedValue(response());
});

test("only administrators request and see billing notices", () => {
  show("user");
  expect(api.get).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
});

test("dismissal survives reloads and resets on the next billing day", async () => {
  const view = show();
  await screen.findByRole("status");
  expect(screen.getByRole("link").getAttribute("href")).toBe("/financeiro");
  fireEvent.click(screen.getByRole("button"));
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  const reloaded = show();
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole("status")).toBeNull();
  api.get.mockResolvedValue(
    response("2026-09-26", { severity: "error", remainingDays: 5 })
  );
  fireEvent(window, new Event("focus"));
  expect(await screen.findByRole("status")).toBeTruthy();
  reloaded.unmount();
});

test("an open page refreshes at midnight and clears confirmed payments", async () => {
  jest.useFakeTimers();
  const view = show();
  await act(async () => {});
  fireEvent.click(screen.getByRole("button"));
  api.get.mockResolvedValue(
    response("2026-09-26", { severity: "error", remainingDays: 5 })
  );
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(screen.getByRole("status").textContent).toContain(
    "subscriptionNotice.overdue5"
  );
  api.get.mockResolvedValue(response("2026-09-26", null));
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  jest.useRealTimers();
});
