import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ModesTrack } from "./Experience";

jest.mock("../../translate/i18n", () => {
  const copy = require("../../translate/languages/pt").messages.pt.translations;
  return {
    i18n: {
      t: key => key.split(".").reduce((current, part) => current?.[part], copy)
    }
  };
});
jest.mock("./plans", () => ({ assetUrl: path => path }));

let matchMedia;

beforeEach(() => {
  jest.useFakeTimers();
  matchMedia = window.matchMedia;
  window.matchMedia = jest.fn(query => ({
    matches: query === "(max-width: 960px)",
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));
});

afterEach(() => {
  window.matchMedia = matchMedia;
  jest.useRealTimers();
});

test("mobile connection choice stays stable while the visitor reads", () => {
  render(<ModesTrack />);
  const official = screen.getByRole("button", { name: "API oficial" });
  expect(official.getAttribute("aria-pressed")).toBe("true");
  act(() => jest.advanceTimersByTime(20000));
  expect(official.getAttribute("aria-pressed")).toBe("true");
  expect(
    screen.queryByRole("heading", { name: /Qualquer que seja/ })
  ).toBeNull();
});

test("mobile visitors can select QR code and compare the shared resources", () => {
  render(<ModesTrack />);
  fireEvent.click(screen.getByRole("button", { name: "QR code" }));
  expect(
    screen.getByRole("button", { name: "QR code" }).getAttribute("aria-pressed")
  ).toBe("true");
  expect(
    screen.queryByRole("heading", { name: /API oficial da Meta/ })
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mesmos recursos" }));
  expect(
    screen.getByRole("heading", { name: /Qualquer que seja/ })
  ).toBeTruthy();
  act(() => jest.advanceTimersByTime(20000));
  expect(
    screen
      .getByRole("button", { name: "Mesmos recursos" })
      .getAttribute("aria-pressed")
  ).toBe("true");
});
