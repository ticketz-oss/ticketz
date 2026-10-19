import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Whitelabel from "./Whitelabel";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import useSettings from "../../hooks/useSettings";
import toastError from "../../errors/toastError";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../services/config", () => ({
  getBackendURL: () => "https://test.example/backend"
}));
jest.mock("../../services/api", () => ({ post: jest.fn() }));
jest.mock("../../hooks/useSettings", () => jest.fn());
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../helpers/i18nToast", () => ({
  i18nToast: { success: jest.fn() }
}));
jest.mock("../ColorPicker", () => () => null);
jest.mock("./LoginCustomization", () => ({ onSave }) => (
  <button onClick={() => onSave("loginHeadline", "Saved headline")}>
    Save login
  </button>
));

const theme = createTheme({
  calculatedLogoLight: () => "/light.png",
  calculatedLogoDark: () => "/dark.png"
});
const settings = [{ key: "appName", value: "My company" }];
let update;
let onSettingSaved;
function editor(values = settings) {
  return (
    <ThemeProvider theme={theme}>
      <ColorModeContext.Provider
        value={{
          colorMode: {
            setAppLogoLight: jest.fn(),
            setAppLogoDark: jest.fn(),
            setAppLogoFavicon: jest.fn()
          }
        }}
      >
        <Whitelabel settings={values} onSettingSaved={onSettingSaved} />
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockReset();
  update = jest.fn().mockResolvedValue(undefined);
  onSettingSaved = jest.fn();
  useSettings.mockReturnValue({ update });
});

test("notifies the parent only after the login setting has persisted", async () => {
  let resolveUpdate;
  update.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveUpdate = resolve;
      })
  );
  render(editor());
  fireEvent.click(screen.getByRole("button", { name: "Save login" }));
  expect(onSettingSaved).not.toHaveBeenCalled();
  await act(async () => resolveUpdate());
  expect(onSettingSaved).toHaveBeenCalledWith(
    "loginHeadline",
    "Saved headline"
  );
});

test.each([
  ["upload-logo-light-button", "/settings/logo", "appLogoLight"],
  [
    "upload-login-sidepanel-image-button",
    "/settings/publicFile",
    "loginSidePanelImage"
  ]
])(
  "propagates successfully uploaded branding assets to the parent (%s)",
  async (id, route, key) => {
    api.post.mockResolvedValueOnce({ data: "branding/17/replacement.png" });
    const { container } = render(editor());
    const fileInput = container.querySelector(`#${id}`);
    expect(fileInput).toBeTruthy();
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["image"], "logo.png", { type: "image/png" })]
      }
    });
    await waitFor(() =>
      expect(onSettingSaved).toHaveBeenCalledWith(
        key,
        "branding/17/replacement.png"
      )
    );
    expect(api.post.mock.calls[0][0]).toBe(route);
  }
);

test("canceling the file picker does not upload or notify the parent", () => {
  const { container } = render(editor());
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [] }
  });
  expect(api.post).not.toHaveBeenCalled();
  expect(onSettingSaved).not.toHaveBeenCalled();
});

test("a failed upload keeps the existing branding and reports the failure", async () => {
  const error = new Error("Upload failed");
  api.post.mockRejectedValueOnce(error);
  const { container } = render(editor());
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [new File(["image"], "logo.png", { type: "image/png" })] }
  });
  await waitFor(() => expect(toastError).toHaveBeenCalledWith(error));
  expect(onSettingSaved).not.toHaveBeenCalled();
});

test("a saved-field parent refresh does not erase an unsaved app name", () => {
  const { rerender } = render(editor());
  const appName = screen.getByDisplayValue("My company");
  fireEvent.change(appName, { target: { value: "Unsaved company name" } });
  rerender(
    editor([...settings, { key: "loginHeadline", value: "Saved headline" }])
  );
  expect(appName.value).toBe("Unsaved company name");
});
