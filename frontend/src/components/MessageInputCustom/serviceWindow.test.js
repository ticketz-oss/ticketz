import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

import MessageInputCustom from "./index";
import { AuthContext } from "../../context/Auth/AuthContext";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import { SocketContext } from "../../context/Socket/SocketContext";

import api from "../../services/api";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  request: jest.fn()
}));
jest.mock("@material-ui/core/withWidth", () => ({
  __esModule: true,
  default: () => Component => Component,
  isWidthUp: () => true
}));
jest.mock("mic-recorder-to-mp3", () =>
  jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: () => ({ getMp3: jest.fn().mockResolvedValue([{}, new Blob()]) })
  }))
);

const fakeSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
};
const socketManager = { GetSocket: () => fakeSocket };

const baseTicket = { id: 1, status: "open", isGroup: false, contact: {} };

const mount = whatsapp =>
  render(
    <SocketContext.Provider value={socketManager}>
      <AuthContext.Provider value={{ user: { name: "Agente" } }}>
        <ReplyMessageContext.Provider
          value={{ replyingMessage: null, setReplyingMessage: jest.fn() }}
        >
          <EditMessageContext.Provider
            value={{ editingMessage: null, setEditingMessage: jest.fn() }}
          >
            <MessageInputCustom
              ticket={{ ...baseTicket, whatsapp }}
              showTabGroups
            />
          </EditMessageContext.Provider>
        </ReplyMessageContext.Provider>
      </AuthContext.Provider>
    </SocketContext.Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  api.request.mockResolvedValue({ data: [] });
});

// Texto livre fora da janela de 24h e recusado pela Meta (131047): a barra
// precisa dizer isso e oferecer o template, em vez de deixar o atendente
// mandar uma mensagem que nunca chega.
it("blocks free text and offers a template when the 24h window is closed", async () => {
  api.get.mockResolvedValue({
    data: {
      official: true,
      window: { open: false, lastInboundAt: null, expiresAt: null },
      templates: []
    }
  });

  mount({ apiMode: "official" });

  expect(
    await screen.findByText("messagesInput.serviceWindowClosed")
  ).toBeInTheDocument();
  expect(screen.getByText("messagesInput.sendTemplate")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByLabelText("upload")).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  );
});

it("keeps the bar untouched while the window is open", async () => {
  api.get.mockResolvedValue({
    data: {
      official: true,
      window: { open: true, lastInboundAt: new Date(), expiresAt: new Date() },
      templates: []
    }
  });

  mount({ apiMode: "official" });

  await waitFor(() => expect(api.get).toHaveBeenCalled());
  expect(
    screen.queryByText("messagesInput.serviceWindowClosed")
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("upload")).not.toHaveAttribute(
    "aria-disabled",
    "true"
  );
});

// Conexao Baileys nao tem janela de 24h; nada pode mudar para ela.
it("never asks for the window on a baileys connection", async () => {
  mount({ apiMode: "baileys" });

  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(api.get).not.toHaveBeenCalled();
  expect(
    screen.queryByText("messagesInput.serviceWindowClosed")
  ).not.toBeInTheDocument();
});
