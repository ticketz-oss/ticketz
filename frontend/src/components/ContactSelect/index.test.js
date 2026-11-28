import React from "react";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { ContactSelect } from "./index";
import api from "../../services/api";
import toastError from "../../errors/toastError";

jest.mock("../../services/api", () => ({ get: jest.fn() }));
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../translate/i18n", () => ({
  i18n: { t: key => key }
}));

const contact = id => ({ id, name: `Contact ${id}`, number: `${id}` });

beforeEach(() => {
  api.get.mockReset();
  jest
    .spyOn(HTMLElement.prototype, "clientHeight", "get")
    .mockImplementation(function () {
      return this.getAttribute("role") === "listbox" ? 100 : 0;
    });
  jest
    .spyOn(HTMLElement.prototype, "scrollHeight", "get")
    .mockImplementation(function () {
      return this.getAttribute("role") === "listbox"
        ? within(this).queryAllByRole("option").length * 40
        : 0;
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("loads pages until the list scrolls, then loads more on scroll", async () => {
  api.get
    .mockResolvedValueOnce({ data: { contacts: [contact(1)], hasMore: true } })
    .mockResolvedValueOnce({ data: { contacts: [contact(2)], hasMore: true } })
    .mockResolvedValueOnce({ data: { contacts: [contact(3)], hasMore: true } })
    .mockResolvedValueOnce({
      data: { contacts: [contact(4)], hasMore: false }
    });

  render(<ContactSelect onSelected={jest.fn()} />);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "12" } });

  await screen.findByText("Contact 3 - 3");
  expect(api.get).toHaveBeenCalledTimes(3);
  expect(api.get).toHaveBeenNthCalledWith(3, "contacts", {
    params: { searchParam: "12", pageNumber: 3 }
  });

  fireEvent.scroll(screen.getByRole("listbox"), { target: { scrollTop: 20 } });
  await screen.findByText("Contact 4 - 4");
  fireEvent.scroll(screen.getByRole("listbox"), { target: { scrollTop: 60 } });
  expect(api.get).toHaveBeenCalledTimes(4);
});

test("continues when an excluded contact leaves the first page empty", async () => {
  api.get
    .mockResolvedValueOnce({ data: { contacts: [contact(1)], hasMore: true } })
    .mockResolvedValueOnce({
      data: { contacts: [contact(2)], hasMore: false }
    });

  render(<ContactSelect onSelected={jest.fn()} excludeId={1} />);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "12" } });

  await screen.findByText("Contact 2 - 2");
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Contact 1 - 1")).not.toBeInTheDocument();
});

test("ignores an earlier search response after the search changes", async () => {
  let resolveFirst;
  api.get
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    )
    .mockResolvedValueOnce({
      data: { contacts: [contact(2)], hasMore: false }
    });

  render(<ContactSelect onSelected={jest.fn()} />);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "12" } });
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  fireEvent.change(input, { target: { value: "123" } });
  await screen.findByText("Contact 2 - 2");
  await act(async () => {
    resolveFirst({ data: { contacts: [contact(1)], hasMore: true } });
  });
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Contact 1 - 1")).not.toBeInTheDocument();
});

test("restarts at page one when the search changes after pagination", async () => {
  api.get
    .mockResolvedValueOnce({ data: { contacts: [contact(1)], hasMore: true } })
    .mockResolvedValueOnce({ data: { contacts: [contact(2)], hasMore: false } })
    .mockResolvedValueOnce({
      data: { contacts: [contact(3)], hasMore: false }
    });

  render(<ContactSelect onSelected={jest.fn()} />);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "12" } });
  await screen.findByText("Contact 2 - 2");
  fireEvent.change(input, { target: { value: "123" } });
  await screen.findByText("Contact 3 - 3");
  expect(api.get).toHaveBeenCalledTimes(3);
  expect(api.get).toHaveBeenLastCalledWith("contacts", {
    params: { searchParam: "123", pageNumber: 1 }
  });
  expect(screen.queryByText("Contact 1 - 1")).not.toBeInTheDocument();
});

test("reports a failed automatic page without retrying indefinitely", async () => {
  const error = new Error("Request failed");
  api.get
    .mockResolvedValueOnce({ data: { contacts: [contact(1)], hasMore: true } })
    .mockRejectedValueOnce(error);

  render(<ContactSelect onSelected={jest.fn()} />);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "12" } });

  await waitFor(() => expect(toastError).toHaveBeenCalledWith(error));
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Contact 1 - 1")).toBeInTheDocument();
});
