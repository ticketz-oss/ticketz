import React from "react";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import Connections from "./index";
import { WhatsAppsProvider } from "../../context/WhatsApp/WhatsAppsContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

jest.mock("qrcode.react", () => ({ value }) => <div>QR: {value}</div>);
jest.mock("../../components/WhatsAppModal", () => () => null);
jest.mock("../../components/ConfirmationModal", () => () => null);
jest.mock("../../components/PrivacyModal", () => () => null);
jest.mock("../../components/WavoipModal", () => () => null);
jest.mock("../../helpers/wavoipCallManager", () => ({
  wavoipAvailable: false
}));
const mockGetPublicSetting = jest.fn().mockResolvedValue("");
jest.mock("../../hooks/useSettings", () => () => ({
  getPublicSetting: mockGetPublicSetting
}));
jest.mock("../../services/api", () => ({ get: jest.fn() }));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));

const createSocketManager = () => {
  const listeners = new Map();
  const manager = {
    GetSocket: () => {
      const registrations = [];
      return {
        on: (event, callback) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event).add(callback);
          registrations.push([event, callback]);
        },
        disconnect: () => {
          registrations.forEach(([event, callback]) =>
            listeners.get(event).delete(callback)
          );
        }
      };
    }
  };
  const emit = session => {
    act(() => {
      [...listeners.get("company-7-whatsappSession")].forEach(callback =>
        callback({ action: "update", session })
      );
    });
  };
  return { manager, emit };
};

test("keeps the QR modal subscribed through refreshes and closes it on expiration", async () => {
  const { manager, emit } = createSocketManager();
  const connection = {
    id: 1,
    name: "Test connection",
    channel: "whatsapp",
    status: "qrcode",
    qrcode: "first",
    updatedAt: "2026-01-01T12:00:00Z"
  };
  api.get.mockImplementation(url =>
    Promise.resolve({ data: url === "/whatsapp" ? [connection] : connection })
  );
  localStorage.setItem("companyId", "7");

  const { unmount } = render(
    <SocketContext.Provider value={manager}>
      <WhatsAppsProvider>
        <Connections />
      </WhatsAppsProvider>
    </SocketContext.Provider>
  );

  try {
    fireEvent.click(
      await screen.findByRole("button", {
        name: "connections.toolTips.scan"
      })
    );
    await screen.findByText("QR: first");
    emit({ ...connection, qrcode: "second" });
    expect(screen.getByText("QR: second")).toBeInTheDocument();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1600));
    });
    expect(screen.getByRole("dialog")).toBeVisible();

    emit({ ...connection, status: "DISCONNECTED", qrcode: "" });
    expect(
      screen.getByText("connections.status.disconnected")
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeVisible());
  } finally {
    unmount();
    localStorage.removeItem("companyId");
  }
});

test("preserves the selected connection when switching from QR to passkey", async () => {
  const { manager, emit } = createSocketManager();
  const connection = {
    id: 2,
    name: "Passkey connection",
    channel: "whatsapp",
    status: "qrcode",
    qrcode: "first",
    updatedAt: "2026-01-01T12:00:00Z"
  };
  api.get.mockImplementation(url =>
    Promise.resolve({ data: url === "/whatsapp" ? [connection] : connection })
  );
  localStorage.setItem("companyId", "7");
  const { unmount } = render(
    <SocketContext.Provider value={manager}>
      <WhatsAppsProvider>
        <Connections />
      </WhatsAppsProvider>
    </SocketContext.Provider>
  );

  try {
    fireEvent.click(
      await screen.findByRole("button", { name: "connections.toolTips.scan" })
    );
    await screen.findByText("QR: first");
    emit({ ...connection, status: "passkey_required", qrcode: "token" });
    expect(await screen.findByText("passkeyModal.title")).toBeVisible();
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/whatsapp/2?session=0")
    );

    emit({ ...connection, status: "CONNECTED", qrcode: "" });
    await waitFor(
      () => expect(screen.queryByRole("dialog")).not.toBeVisible(),
      {
        timeout: 2500
      }
    );
  } finally {
    unmount();
    localStorage.removeItem("companyId");
  }
});
