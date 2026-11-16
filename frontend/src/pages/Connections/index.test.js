import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Connections from "./index";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import api from "../../services/api";

jest.mock("../../components/WhatsAppModal", () => () => null);
jest.mock(
  "../../components/QrcodeModal",
  () =>
    ({ open, whatsAppId }) =>
      open ? <div>QR modal: {whatsAppId}</div> : null
);
jest.mock("../../components/PasskeyModal", () => () => null);
jest.mock("../../components/PrivacyModal", () => () => null);
jest.mock("../../services/api", () => ({
  put: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({})
}));
jest.mock("../../translate/i18n", () => ({
  i18n: {
    t: (key, options) => {
      if (key === "confirmationModal.deleteRecordTitle") {
        return `Delete: ${options.type} - ${options.name}`;
      }
      if (key === "confirmationModal.deleteRecordMessage") {
        return `Delete ${options.type}: ${options.name}?`;
      }
      if (key === "confirmationModal.confirmationWord") return "exclude";
      if (key === "confirmationModal.typeToConfirm") {
        return `Type ${options.word} to confirm`;
      }
      return key;
    }
  }
}));
jest.mock("../../helpers/formatWhatsappDisplay", () => ({
  formatWhatsappDigits: number => number
}));

const connections = [
  {
    id: 1,
    name: "Default",
    channel: "whatsapp",
    status: "CONNECTED",
    isDefault: true,
    connectedNumber: "123456789",
    updatedAt: "2026-01-01T12:00:00Z"
  },
  {
    id: 2,
    name: "Other",
    channel: "whatsapp",
    status: "DISCONNECTED",
    isDefault: false,
    updatedAt: "2026-01-01T12:00:00Z"
  },
  {
    id: 3,
    name: "Unsupported",
    channel: "other",
    status: "CONNECTED",
    isDefault: false,
    updatedAt: "2026-01-01T12:00:00Z"
  }
];

test("keeps card dimensions and default slots consistent across connections", () => {
  render(
    <WhatsAppsContext.Provider
      value={{ whatsApps: connections, loading: false }}
    >
      <Connections />
    </WhatsAppsContext.Provider>
  );

  fireEvent.click(screen.getByText(/connections.buttons.showUnsupported/));

  const cards = screen.getAllByTestId("connection-card");
  expect(cards).toHaveLength(3);
  const grid = screen.getByTestId("connections-grid");
  expect(getComputedStyle(grid).display).toBe("grid");
  expect(getComputedStyle(grid).gridAutoRows).toBe("1fr");
  cards.forEach(card => expect(getComputedStyle(card).height).toBe("100%"));

  const defaultSlot = within(cards[0]).getByTestId("connection-actions");
  const otherSlot = within(cards[1]).getByTestId("connection-actions");
  expect(defaultSlot.className).toBe(otherSlot.className);
  expect(getComputedStyle(otherSlot).minHeight).toBe("32px");
  expect(
    within(otherSlot).getByRole("button", {
      name: "connections.toolTips.newQr"
    })
  ).toBeInTheDocument();
  expect(
    within(cards[2]).getByTestId("connection-actions")
  ).not.toHaveTextContent();
  expect(within(cards[2]).queryByText("connections.table.session")).toBeNull();
});

test("provides QR actions in the card and the existing menu", () => {
  const qrConnections = [
    { ...connections[0], status: "qrcode" },
    connections[1],
    { ...connections[2], status: "DISCONNECTED" }
  ];
  render(
    <WhatsAppsContext.Provider
      value={{ whatsApps: qrConnections, loading: false }}
    >
      <Connections />
    </WhatsAppsContext.Provider>
  );
  fireEvent.click(screen.getByText(/connections.buttons.showUnsupported/));

  const cards = screen.getAllByTestId("connection-card");
  const scan = within(cards[0]).getByRole("button", {
    name: "connections.toolTips.scan"
  });
  const generate = within(cards[1]).getByRole("button", {
    name: "connections.toolTips.newQr"
  });
  expect(within(scan).getByTestId("scan-qr-icon")).toBeInTheDocument();
  expect(within(generate).getByTestId("generate-qr-icon")).toBeInTheDocument();
  const defaultSlot = within(cards[0]).getByTestId("connection-actions");
  expect(defaultSlot).toContainElement(scan);
  expect(defaultSlot).toContainElement(
    within(cards[0]).getByText("connections.table.default")
  );
  expect(
    getComputedStyle(within(cards[1]).getByTestId("qr-action-slot"))
      .justifyContent
  ).toBe("flex-end");
  expect(
    within(cards[2]).queryByRole("button", {
      name: "connections.toolTips.newQr"
    })
  ).toBeNull();

  fireEvent.click(generate);
  expect(api.put).toHaveBeenCalledWith("/whatsappsession/2");
  fireEvent.click(within(cards[1]).getByLabelText("actions"));
  fireEvent.click(
    screen.getByRole("menuitem", { name: "connections.toolTips.newQr" })
  );
  expect(api.put).toHaveBeenCalledTimes(2);
  fireEvent.click(scan);
  expect(screen.getByText("QR modal: 1")).toBeInTheDocument();
  fireEvent.click(within(cards[0]).getByLabelText("actions"));
  expect(
    screen.getByRole("menuitem", { name: "connections.toolTips.scan" })
  ).toBeInTheDocument();
});

test("places the connected number beside the last update", () => {
  render(
    <WhatsAppsContext.Provider
      value={{ whatsApps: connections, loading: false }}
    >
      <Connections />
    </WhatsAppsContext.Provider>
  );

  const cards = screen.getAllByTestId("connection-card");
  const updateColumn = within(cards[0]).getByTestId("last-update-column");
  const numberColumn = within(cards[0]).getByTestId("connected-number-column");
  expect(
    within(updateColumn).getByText("connections.table.lastUpdate")
  ).toBeInTheDocument();
  expect(
    within(numberColumn).getByText("connections.table.connectedNumber")
  ).toBeInTheDocument();
  expect(updateColumn).toHaveClass("MuiGrid-grid-xs-6");
  expect(numberColumn).toHaveClass("MuiGrid-grid-xs-6");
  expect(within(numberColumn).getByText("123456789")).toBeInTheDocument();
  expect(
    within(cards[1]).queryByText("connections.table.connectedNumber")
  ).toBeNull();
});

test("identifies the selected connection and deletes its id after confirmation", async () => {
  render(
    <WhatsAppsContext.Provider
      value={{ whatsApps: connections, loading: false }}
    >
      <Connections />
    </WhatsAppsContext.Provider>
  );

  const card = screen.getAllByTestId("connection-card")[1];
  fireEvent.click(within(card).getByLabelText("actions"));
  fireEvent.click(screen.getByRole("menuitem", { name: "common.delete" }));

  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).getByText("Delete: common.connection - Other")
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText("Delete common.connection: Other?")
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText("connections.confirmationModal.deleteMessage")
  ).toBeInTheDocument();

  const button = within(dialog).getByRole("button", { name: "common.delete" });
  expect(button).toBeDisabled();
  fireEvent.change(within(dialog).getByRole("textbox"), {
    target: { value: "exclude" }
  });
  await act(async () => {
    fireEvent.click(button);
  });
  expect(api.delete).toHaveBeenCalledWith("/whatsapp/2", {
    params: { closeTickets: false }
  });
});
