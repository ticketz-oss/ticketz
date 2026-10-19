import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WhatsappStatusTenants from "./WhatsappStatusTenants";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";

jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({ user: {} })
}));
jest.mock("../../services/api", () => ({
  get: jest.fn(),
  put: jest.fn()
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}));
jest.mock("../../translate/i18n", () => ({
  i18n: {
    language: "pt",
    t: (key, options) =>
      options && options.id !== undefined ? `${key}:${options.id}` : key
  }
}));

const companies = [
  {
    id: 3,
    name: "Empresa A",
    whatsappMode: "normal",
    whatsappStatusEnabled: true
  },
  {
    id: 4,
    name: "Empresa B",
    whatsappMode: "meta",
    whatsappStatusEnabled: false
  }
];

const panel = (superAdmin = true) => (
  <AuthContext.Provider value={{ user: { super: superAdmin } }}>
    <WhatsappStatusTenants />
  </AuthContext.Provider>
);

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: { companies, hasMore: false } });
});

it("lists companies with their status flag", async () => {
  render(panel());

  const companyA = await screen.findByRole("checkbox", { name: "Empresa A" });
  const companyB = screen.getByRole("checkbox", { name: "Empresa B" });
  expect(companyA).toBeChecked();
  expect(companyB).not.toBeChecked();
  expect(api.get).toHaveBeenCalledWith(
    "/whatsapp-status/admin/companies",
    expect.objectContaining({
      params: { searchParam: "", pageNumber: 1 }
    })
  );
});

it("toggles a company and shows the saved state", async () => {
  api.put.mockResolvedValue({
    data: { id: 3, name: "Empresa A", whatsappStatusEnabled: false }
  });
  render(panel());

  const companyA = await screen.findByRole("checkbox", { name: "Empresa A" });
  fireEvent.click(companyA);

  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/whatsapp-status/admin/companies/3", {
      enabled: false
    })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("checkbox", { name: "Empresa A" })
    ).not.toBeChecked()
  );
  expect(screen.getAllByText("whatsappStatusTenants.disabled")).toHaveLength(2);
});

it("reverts the switch and shows an error when saving fails", async () => {
  api.put.mockRejectedValue({ response: { status: 500 } });
  render(panel());

  const companyB = await screen.findByRole("checkbox", { name: "Empresa B" });
  fireEvent.click(companyB);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "whatsappStatusTenants.saveError"
  );
  expect(api.put).toHaveBeenCalledWith("/whatsapp-status/admin/companies/4", {
    enabled: true
  });
  expect(screen.getByRole("checkbox", { name: "Empresa B" })).not.toBeChecked();
});

it("shows the Cloud API note for meta companies", async () => {
  render(panel());

  await screen.findByRole("checkbox", { name: "Empresa B" });
  expect(screen.getAllByText("whatsappStatusTenants.metaNote")).toHaveLength(1);
});

it("searches by name and loads more pages", async () => {
  api.get
    .mockResolvedValueOnce({ data: { companies, hasMore: true } })
    .mockResolvedValueOnce({
      data: {
        companies: [
          {
            id: 5,
            name: "Empresa C",
            whatsappMode: "normal",
            whatsappStatusEnabled: false
          }
        ],
        hasMore: false
      }
    })
    .mockResolvedValue({ data: { companies: [companies[1]], hasMore: false } });
  render(panel());

  fireEvent.click(
    await screen.findByRole("button", { name: "whatsappStatusTenants.more" })
  );
  expect(
    await screen.findByRole("checkbox", { name: "Empresa C" })
  ).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith(
    "/whatsapp-status/admin/companies",
    expect.objectContaining({
      params: { searchParam: "", pageNumber: 2 }
    })
  );
  expect(
    screen.queryByRole("button", { name: "whatsappStatusTenants.more" })
  ).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("whatsappStatusTenants.search"), {
    target: { value: "B" }
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenLastCalledWith(
      "/whatsapp-status/admin/companies",
      expect.objectContaining({
        params: { searchParam: "B", pageNumber: 1 }
      })
    )
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("checkbox", { name: "Empresa A" })
    ).not.toBeInTheDocument()
  );
});

it("renders nothing for users who are not super admins", () => {
  const { container } = render(panel(false));
  expect(container).toBeEmptyDOMElement();
  expect(api.get).not.toHaveBeenCalled();
});
