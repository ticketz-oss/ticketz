import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgentAvailability from "./AgentAvailability";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));
jest.mock(".", () => () => <button>Luiza's Agent</button>);

describe("Agent availability", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hides the launcher until the authenticated tenant is confirmed enabled", async () => {
    let resolve;
    api.get.mockImplementation(() => new Promise(done => (resolve = done)));
    render(<AgentAvailability companyId={1} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await act(async () => resolve({ data: { enabled: true } }));
    expect(screen.getByRole("button", { name: "Luiza's Agent" })).toBeVisible();
    expect(api.get).toHaveBeenCalledWith("/agent/availability");
  });

  it("hides the launcher for disabled, missing, or unavailable policies", async () => {
    api.get.mockResolvedValueOnce({ data: { enabled: false } });
    const view = render(<AgentAvailability companyId={1} />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    api.get.mockResolvedValueOnce({ data: {} });
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    api.get.mockRejectedValueOnce(new Error("unavailable"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    view.unmount();
  });

  it("removes the launcher after a tenant policy is disabled", async () => {
    api.get.mockResolvedValueOnce({ data: { enabled: true } });
    render(<AgentAvailability companyId={1} />);
    await screen.findByRole("button", { name: "Luiza's Agent" });

    api.get.mockResolvedValueOnce({ data: { enabled: false } });
    act(() => {
      window.dispatchEvent(new Event("agent-availability-changed"));
    });
    await waitFor(() =>
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    );
  });
});
