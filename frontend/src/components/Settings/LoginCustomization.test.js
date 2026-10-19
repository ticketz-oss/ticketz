import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import LoginCustomization from "./LoginCustomization";
import toastError from "../../errors/toastError";
import { i18nToast } from "../../helpers/i18nToast";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
jest.mock("../../helpers/i18nToast", () => ({
  i18nToast: { success: jest.fn() }
}));
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../LoginExperience/BrandPanel", () => ({ settings, preview }) => (
  <div
    data-testid="brand-preview"
    data-settings={JSON.stringify(settings)}
    data-preview={preview}
  />
));

const headline = () => screen.getByLabelText("loginExperience.headlineLabel");
const description = () =>
  screen.getByLabelText("loginExperience.descriptionLabel");
const saveButton = () =>
  screen.getByRole("button", { name: "loginExperience.saveCustomization" });

beforeEach(() => jest.clearAllMocks());

test("loads asynchronous settings, previews the tenant brand and caps custom text", () => {
  const save = jest.fn();
  const { rerender } = render(
    <LoginCustomization settings={{}} onSave={save} />
  );
  expect(saveButton().disabled).toBe(true);
  rerender(
    <LoginCustomization
      settings={{
        loginHeadline: "Bem-vindo",
        appLogoDark: "branding/2/logo.png"
      }}
      onSave={save}
    />
  );
  expect(headline().value).toBe("Bem-vindo");
  expect(headline().maxLength).toBe(120);
  expect(description().maxLength).toBe(240);
  const preview = JSON.parse(
    screen.getByTestId("brand-preview").getAttribute("data-settings")
  );
  expect(preview.appLogoDark).toBe("branding/2/logo.png");
  expect(preview.loginTemplate).toBe("aurora");
  expect(save).not.toHaveBeenCalled();
});

test("keeps a user's unsaved draft when the settings refetch or a logo changes", () => {
  const { rerender } = render(
    <LoginCustomization
      settings={{ loginHeadline: "Original" }}
      onSave={jest.fn()}
    />
  );
  fireEvent.change(headline(), { target: { value: "Minha marca" } });
  rerender(
    <LoginCustomization
      settings={{ loginHeadline: "Socket update", appLogoDark: "new-logo.png" }}
      onSave={jest.fn()}
    />
  );
  expect(headline().value).toBe("Minha marca");
  expect(
    JSON.parse(
      screen.getByTestId("brand-preview").getAttribute("data-settings")
    )
  ).toMatchObject({
    loginHeadline: "Minha marca",
    appLogoDark: "new-logo.png"
  });
});

test("only saves explicitly, prevents duplicate submissions and keeps tenant API keys", async () => {
  let resolveFirst;
  const save = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    )
    .mockResolvedValue(undefined);
  render(
    <LoginCustomization settings={{ loginTemplate: "minimal" }} onSave={save} />
  );
  fireEvent.change(headline(), { target: { value: "  Minha marca  " } });
  fireEvent.change(description(), { target: { value: "Tudo em um lugar." } });
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(saveButton());
  expect(
    screen.getByRole("button", { name: "loginExperience.saving" }).disabled
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "loginExperience.saving" })
  );
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => resolveFirst());
  await waitFor(() => expect(saveButton().disabled).toBe(true));
  expect(save.mock.calls).toEqual([
    ["loginHeadline", "Minha marca"],
    ["loginDescription", "Tudo em um lugar."],
    ["loginTemplate", "minimal"]
  ]);
  expect(i18nToast.success).toHaveBeenCalledWith("settings.success");
});

test("keeps edits and allows a retry after a failed save without claiming success", async () => {
  const error = new Error("offline");
  const save = jest
    .fn()
    .mockRejectedValueOnce(error)
    .mockResolvedValue(undefined);
  render(<LoginCustomization settings={{}} onSave={save} />);
  fireEvent.change(headline(), { target: { value: "Não perder" } });
  fireEvent.click(saveButton());
  await waitFor(() => expect(toastError).toHaveBeenCalledWith(error));
  expect(headline().value).toBe("Não perder");
  expect(saveButton().disabled).toBe(false);
  expect(i18nToast.success).not.toHaveBeenCalled();
  fireEvent.click(saveButton());
  await waitFor(() => expect(i18nToast.success).toHaveBeenCalledTimes(1));
});

test("allows clearing custom text to restore translated defaults", async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  render(
    <LoginCustomization settings={{ loginHeadline: "Custom" }} onSave={save} />
  );
  fireEvent.change(headline(), { target: { value: "" } });
  fireEvent.click(saveButton());
  await waitFor(() => expect(save).toHaveBeenCalledWith("loginHeadline", ""));
  await waitFor(() => expect(saveButton().disabled).toBe(true));
});
