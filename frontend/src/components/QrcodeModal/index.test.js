import React, { useState } from "react";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import QrcodeModal from "./index";
import useWhatsApps from "../../hooks/useWhatsApps";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

jest.mock("qrcode.react", () => ({ value }) => <div>QR: {value}</div>);
jest.mock("../../services/api", () => ({ get: jest.fn() }));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));

afterEach(() => {
  localStorage.removeItem("companyId");
});

test("propagates QR expiration to the list and closes only its own modal", async () => {
  const callbacks = {};
  const manager = {
    GetSocket: () => ({
      on: (event, callback) => {
        callbacks[event] = [...(callbacks[event] || []), callback];
      },
      disconnect: jest.fn()
    })
  };
  const connections = [
    { id: 1, status: "qrcode", qrcode: "first" },
    { id: 2, status: "qrcode", qrcode: "second" }
  ];
  api.get.mockImplementation(url =>
    Promise.resolve({
      data: url === "/whatsapp" ? connections : connections[0]
    })
  );
  localStorage.setItem("companyId", "7");
  const onClose = jest.fn();

  const ConnectionsState = () => {
    const { whatsApps } = useWhatsApps();
    return <div>{whatsApps.map(w => `${w.id}:${w.status}`).join(",")}</div>;
  };

  const OpenModal = () => {
    const [open, setOpen] = useState(true);
    return (
      <QrcodeModal
        open={open}
        whatsAppId={1}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      />
    );
  };

  render(
    <SocketContext.Provider value={manager}>
      <ConnectionsState />
      <OpenModal />
    </SocketContext.Provider>
  );

  expect(await screen.findByText("QR: first")).toBeInTheDocument();
  expect(screen.getByText("1:qrcode,2:qrcode")).toBeInTheDocument();

  const updateSession = session => {
    act(() => {
      callbacks["company-7-whatsappSession"].forEach(callback =>
        callback({ action: "update", session })
      );
    });
  };
  updateSession({ id: 2, status: "DISCONNECTED", qrcode: "" });
  expect(screen.getByText("1:qrcode,2:DISCONNECTED")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();

  updateSession({ id: 1, status: "qrcode", qrcode: "refreshed" });
  expect(screen.getByText("QR: refreshed")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();

  updateSession({ id: 1, status: "DISCONNECTED", qrcode: "" });
  expect(screen.getByText("1:DISCONNECTED,2:DISCONNECTED")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeVisible());
});

test("switches the matching QR modal to passkey authentication", async () => {
  let onSession;
  const manager = {
    GetSocket: () => ({
      on: (event, callback) => {
        onSession = callback;
      },
      disconnect: jest.fn()
    })
  };
  api.get.mockResolvedValue({ data: { qrcode: "first" } });
  const onClose = jest.fn();
  const onOpenPasskeyModal = jest.fn();
  render(
    <SocketContext.Provider value={manager}>
      <QrcodeModal
        open
        whatsAppId={1}
        onClose={onClose}
        onOpenPasskeyModal={onOpenPasskeyModal}
      />
    </SocketContext.Provider>
  );
  expect(await screen.findByText("QR: first")).toBeInTheDocument();
  act(() =>
    onSession({
      action: "update",
      session: { id: 1, status: "passkey_required" }
    })
  );
  expect(onOpenPasskeyModal).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});
