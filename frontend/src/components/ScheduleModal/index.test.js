import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import ScheduleModal from ".";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() }
}));

jest.mock("../../errors/toastError", () => jest.fn());

const schedule = {
  id: 1,
  body: "Mensagem agendada",
  kind: "ONCE",
  audienceMode: "SELECTED",
  sendAt: "2026-09-14T15:30:00.000Z",
  sendTime: null,
  timezone: null,
  mediaDeliveryMode: null,
  saveMessage: null,
  audienceContacts: [
    { contact: { id: 10, name: "Ana", number: "5568999999999" } }
  ]
};

const mockRequests = () => {
  api.get.mockImplementation(url => {
    if (url === "/schedules/variables") {
      return Promise.resolve({
        data: { builtIn: [], custom: [], timezone: null }
      });
    }
    if (url === "/commemorative-dates") {
      return Promise.resolve({ data: [] });
    }
    if (url === "/contacts/selection") {
      return Promise.resolve({
        data: { contacts: [], count: 0, hasMore: false }
      });
    }
    if (url === "/schedules/1") {
      return Promise.resolve({ data: schedule });
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
};

describe("ScheduleModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequests();
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
  });

  it("reabre para editar sem acessar o tipo de um arquivo já removido", async () => {
    const props = {
      onClose: jest.fn(),
      cleanContact: jest.fn(),
      reload: jest.fn()
    };
    const { rerender, getByDisplayValue } = render(
      <ScheduleModal {...props} open scheduleId={undefined} />
    );

    const input = await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).not.toBeNull();
      return fileInput;
    });
    const image = new File(["image"], "foto.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [image] } });

    await waitFor(() =>
      expect(URL.createObjectURL).toHaveBeenCalledWith(image)
    );

    rerender(<ScheduleModal {...props} open={false} scheduleId={undefined} />);

    await act(async () => {
      rerender(<ScheduleModal {...props} open scheduleId={1} />);
    });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/schedules/1"));
    await waitFor(() =>
      expect(getByDisplayValue("Mensagem agendada")).toBeTruthy()
    );
    expect(document.querySelector('img[src="blob:preview"]')).toBeNull();
  });

  it("normaliza campos nulos de agendamentos antigos ao editar", async () => {
    const { getByDisplayValue } = render(
      <ScheduleModal open scheduleId={1} onClose={jest.fn()} />
    );

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    await waitFor(() => expect(getByDisplayValue(timezone)).toBeTruthy());
  });
});
