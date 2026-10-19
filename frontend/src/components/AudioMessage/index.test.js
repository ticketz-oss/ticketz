/* eslint-disable testing-library/no-unnecessary-act -- Flush lazy import and media promises, not only the synchronous DOM event. */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AudioMessage, { audioTime } from "./index";
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
const mockDestroy = jest.fn();
const mockLoad = jest.fn(() => Promise.resolve());
const mockOptions = jest.fn();
jest.mock("wavesurfer.js", () => ({
  __esModule: true,
  default: {
    create: options => {
      mockOptions(options);
      const listeners = {};
      Promise.resolve()
        .then(() => mockLoad())
        .then(() => listeners.ready?.())
        .catch(error => listeners.error?.(error));
      return {
        on: (name, handler) => {
          listeners[name] = handler;
        },
        load: mockLoad,
        destroy: mockDestroy
      };
    }
  }
}));
beforeEach(() => {
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  jest
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(() => Promise.resolve());
});
afterEach(() => jest.restoreAllMocks());
test("formats unknown, negative and long audio durations", () => {
  expect(audioTime(Infinity)).toBe("0:00");
  expect(audioTime(-2)).toBe("0:00");
  expect(audioTime(125.9)).toBe("2:05");
});
test("does not autoplay, changes speed, seeks and releases media", async () => {
  let result;
  await act(async () => {
    result = render(<AudioMessage src="/audio.ogg" />);
  });
  const media = screen.getByLabelText("chatExperience.audio");
  expect(media.play).not.toHaveBeenCalled();
  expect(mockLoad).toHaveBeenCalledTimes(1);
  expect(mockOptions.mock.calls[0][0].url).toBe(media.src);
  expect(media.preload).toBe("metadata");
  fireEvent.click(screen.getByLabelText("chatExperience.speed"));
  expect(media.playbackRate).toBe(1.5);
  Object.defineProperty(media, "duration", { configurable: true, value: 60 });
  fireEvent.loadedMetadata(media);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });
  expect(media.currentTime).toBe(20);
  await act(async () => {
    fireEvent.click(screen.getByLabelText("chatExperience.play"));
  });
  expect(media.play).toHaveBeenCalledTimes(1);
  result.unmount();
  expect(mockDestroy).toHaveBeenCalled();
});
test("keeps custom playback, seek and speed if waveform cannot load", async () => {
  mockLoad.mockRejectedValueOnce(new Error("CORS"));
  await act(async () => {
    render(<AudioMessage src="/cors-audio.ogg" />);
  });
  const media = screen.getByLabelText("chatExperience.audio");
  expect(media.controls).toBe(false);
  expect(screen.getByRole("slider")).toBeTruthy();
  expect(screen.getByLabelText("chatExperience.speed")).toBeTruthy();
  await act(async () =>
    fireEvent.click(screen.getByLabelText("chatExperience.play"))
  );
  expect(media.play).toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
});
test("reports an actual playback error and offers the original download", async () => {
  await act(async () => render(<AudioMessage src="/missing.mp3" />));
  fireEvent.error(screen.getByLabelText("chatExperience.audio"));
  expect(screen.getByRole("status").textContent).toContain(
    "chatExperience.audioError"
  );
  expect(screen.getByRole("link").getAttribute("href")).toBe("/missing.mp3");
});
test("does not report pausing an in-flight play as a media failure", async () => {
  await act(async () => render(<AudioMessage src="/slow.mp3" />));
  HTMLMediaElement.prototype.play.mockRejectedValueOnce(
    new DOMException("interrupted", "AbortError")
  );
  await act(async () =>
    fireEvent.click(screen.getByLabelText("chatExperience.play"))
  );
  expect(screen.queryByRole("status")).toBeNull();
});
