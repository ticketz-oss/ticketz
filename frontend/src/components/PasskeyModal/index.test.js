import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import PasskeyModal from "./index";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

const mockGetPublicSetting = jest.fn().mockResolvedValue("");
jest.mock("../../hooks/useSettings", () => () => ({
  getPublicSetting: mockGetPublicSetting
}));
jest.mock("../../services/api", () => ({ get: jest.fn() }));
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));

test("ignores session updates while closed and cancels pending close on dismissal", async () => {
  jest.useFakeTimers();
  const callbacks = new Set();
  const manager = {
    GetSocket: () => {
      let callback;
      return {
        on: (event, listener) => {
          callback = listener;
          callbacks.add(listener);
        },
        disconnect: () => callbacks.delete(callback)
      };
    }
  };
  api.get.mockResolvedValue({ data: { id: 1 } });
  const onClose = jest.fn();
  const renderModal = open => (
    <SocketContext.Provider value={manager}>
      <PasskeyModal open={open} whatsAppId={1} onClose={onClose} />
    </SocketContext.Provider>
  );
  const { rerender, unmount } = render(renderModal(false));

  try {
    expect(callbacks.size).toBe(0);
    expect(api.get).not.toHaveBeenCalled();

    rerender(renderModal(true));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/whatsapp/1?session=0")
    );
    expect(callbacks.size).toBe(1);
    act(() => {
      callbacks.forEach(callback =>
        callback({
          action: "update",
          session: { id: 1, status: "CONNECTED" }
        })
      );
    });

    rerender(renderModal(false));
    expect(callbacks.size).toBe(0);
    act(() => jest.advanceTimersByTime(1500));
    expect(onClose).not.toHaveBeenCalled();
  } finally {
    unmount();
    jest.useRealTimers();
  }
});
