import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Login, { parseLoginLinks } from "./index";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import useSettings from "../../hooks/useSettings";
import getCompanySlug from "../../helpers/getCompanySlug";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({})
}));
jest.mock("../../services/api", () => ({ post: jest.fn() }));
jest.mock("../../hooks/useSettings", () => jest.fn());
jest.mock("../../helpers/getCompanySlug", () => jest.fn());
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../translate/i18n", () => ({
  i18n: {
    t: key => key,
    language: "pt",
    changeLanguage: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock("../../translate/languages", () => ({
  messages: {
    pt: {
      translations: {
        mainDrawer: { appBar: { i18n: { language: "Português" } } }
      }
    },
    en: {
      translations: {
        mainDrawer: { appBar: { i18n: { language: "English" } } }
      }
    }
  }
}));
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ initial, animate, transition, ...props }) => <div {...props} />
  }
}));
jest.mock("../../components/LoginExperience/BrandPanel", () => ({
  __esModule: true,
  default: ({ settings }) => (
    <aside data-testid="brand-panel" data-settings={JSON.stringify(settings)} />
  ),
  BrandLogo: ({ name }) => <span>{name}</span>,
  publicBrandAsset: filename => (filename ? `/public/${filename}` : "")
}));

let getPublicSetting;
let auth;
const theme = createTheme();
const input = name => screen.getByLabelText(new RegExp(`^login.form.${name}`));
const enterEmail = async (response = { proxima_etapa: "senha" }) => {
  api.post.mockResolvedValueOnce({ data: response });
  fireEvent.change(input("email"), { target: { value: "person@example.com" } });
  fireEvent.submit(input("email").closest("form"));
  await screen.findByText("login.buttons.changeEmail");
};
const renderLogin = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider
          value={{ colorMode: { toggleColorMode: jest.fn() } }}
        >
          <AuthContext.Provider value={auth}>
            <Login />
          </AuthContext.Provider>
        </ColorModeContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.post.mockReset();
  getCompanySlug.mockReturnValue("teste");
  getPublicSetting = jest.fn().mockResolvedValue("");
  useSettings.mockReturnValue({ getPublicSetting });
  auth = {
    handleLogin: jest.fn().mockResolvedValue(undefined),
    handlePasswordSetup: jest.fn().mockResolvedValue(undefined),
    loading: false
  };
});

test("identifies the email in its host tenant, then authenticates with the password", async () => {
  renderLogin();
  await enterEmail();
  expect(api.post).toHaveBeenCalledWith("/auth/login/identify", {
    email: "person@example.com",
    slug: "teste"
  });
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  fireEvent.submit(input("password").closest("form"));
  await waitFor(() =>
    expect(auth.handleLogin).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "ExamplePass9"
    })
  );
  expect(auth.handlePasswordSetup).not.toHaveBeenCalled();
});

test("accepts email and password together but identifies the account before one-click login", async () => {
  renderLogin();
  expect(input("password").required).toBe(false);
  expect(
    screen.getByRole("button", { name: "login.buttons.continue" }).disabled
  ).toBe(false);
  fireEvent.change(input("email"), { target: { value: "person@example.com" } });
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  api.post.mockResolvedValueOnce({ data: { proxima_etapa: "senha" } });
  fireEvent.click(screen.getByRole("button", { name: "login.buttons.submit" }));
  await waitFor(() =>
    expect(auth.handleLogin).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "ExamplePass9"
    })
  );
  expect(api.post.mock.invocationCallOrder[0]).toBeLessThan(
    auth.handleLogin.mock.invocationCallOrder[0]
  );
});

test("an unsuccessful one-click login keeps both fields editable for correction", async () => {
  auth.handleLogin.mockResolvedValue(undefined);
  api.post.mockResolvedValueOnce({ data: { proxima_etapa: "senha" } });
  renderLogin();
  fireEvent.change(input("email"), { target: { value: "person@example.com" } });
  fireEvent.change(input("password"), { target: { value: "Incorrect9" } });
  fireEvent.submit(input("email").closest("form"));
  await waitFor(() => expect(auth.handleLogin).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(input("email").disabled).toBe(false));
  expect(input("password").disabled).toBe(false);
  fireEvent.change(input("email"), {
    target: { value: "corrected@example.com" }
  });
  expect(input("email").value).toBe("corrected@example.com");
});

test("an initial password never bypasses first-access setup", async () => {
  renderLogin();
  fireEvent.change(input("password"), { target: { value: "InitialPass9" } });
  await enterEmail({
    proxima_etapa: "criar_senha",
    ativacao_token: "test-activation-token"
  });
  expect(auth.handleLogin).not.toHaveBeenCalled();
  expect(input("newPassword").value).toBe("");
  expect(input("confirmPassword").value).toBe("");
  expect(auth.handlePasswordSetup).not.toHaveBeenCalled();
});

test("suppresses repeated submissions across one-click identify and authentication", async () => {
  let resolveLogin;
  api.post.mockResolvedValueOnce({ data: { proxima_etapa: "senha" } });
  auth.handleLogin.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveLogin = resolve;
      })
  );
  renderLogin();
  fireEvent.change(input("email"), { target: { value: "person@example.com" } });
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  const form = input("email").closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(auth.handleLogin).toHaveBeenCalledTimes(1));
  fireEvent.submit(form);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(auth.handleLogin).toHaveBeenCalledTimes(1);
  await act(async () => resolveLogin());
});

test("omits slug on an unscoped host and allows changing email without retaining password", async () => {
  getCompanySlug.mockReturnValue(null);
  renderLogin();
  await enterEmail();
  expect(api.post.mock.calls[0][1]).toEqual({ email: "person@example.com" });
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  fireEvent.click(
    screen.getByRole("button", { name: "login.buttons.changeEmail" })
  );
  expect(input("email").value).toBe("person@example.com");
  await enterEmail();
  expect(input("password").value).toBe("");
});

test("validates confirmation and strength before submitting first-access setup", async () => {
  renderLogin();
  await enterEmail({
    proxima_etapa: "criar_senha",
    ativacao_token: "test-activation-token"
  });
  fireEvent.change(input("newPassword"), { target: { value: "weak" } });
  fireEvent.change(input("confirmPassword"), {
    target: { value: "different" }
  });
  fireEvent.submit(input("newPassword").closest("form"));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "login.errors.passwordMismatch"
  );
  fireEvent.change(input("confirmPassword"), { target: { value: "weak" } });
  fireEvent.submit(input("newPassword").closest("form"));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "login.errors.passwordStrength"
  );
  expect(auth.handlePasswordSetup).not.toHaveBeenCalled();
  fireEvent.change(input("newPassword"), { target: { value: "ExamplePass9" } });
  fireEvent.change(input("confirmPassword"), {
    target: { value: "ExamplePass9" }
  });
  fireEvent.submit(input("newPassword").closest("form"));
  await waitFor(() =>
    expect(auth.handlePasswordSetup).toHaveBeenCalledWith({
      token: "test-activation-token",
      password: "ExamplePass9",
      password_confirmation: "ExamplePass9"
    })
  );
  expect(auth.handleLogin).not.toHaveBeenCalled();
});

test("suppresses duplicate identify and password requests while pending", async () => {
  let resolveIdentify;
  api.post.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveIdentify = resolve;
      })
  );
  renderLogin();
  fireEvent.change(input("email"), { target: { value: "person@example.com" } });
  const form = input("email").closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(input("email").disabled).toBe(true);
  await act(async () => resolveIdentify({ data: { proxima_etapa: "senha" } }));
  let resolveLogin;
  auth.handleLogin.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveLogin = resolve;
      })
  );
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  const passwordForm = input("password").closest("form");
  fireEvent.submit(passwordForm);
  fireEvent.submit(passwordForm);
  expect(auth.handleLogin).toHaveBeenCalledTimes(1);
  await act(async () => resolveLogin());
});

test("one unavailable public setting does not hide the other tenant branding or disable login", async () => {
  getPublicSetting.mockImplementation(key =>
    key === "loginBackgroundContent"
      ? Promise.reject(new Error("unavailable"))
      : Promise.resolve(
          {
            appName: "Minha empresa",
            loginHeadline: "Minha frase",
            allowSignup: "enabled"
          }[key] || ""
        )
  );
  renderLogin();
  await screen.findByText("Minha empresa");
  expect(
    JSON.parse(screen.getByTestId("brand-panel").dataset.settings)
  ).toMatchObject({
    appName: "Minha empresa",
    loginHeadline: "Minha frase",
    loginBackgroundContent: ""
  });
  expect(
    screen
      .getByRole("link", { name: "login.buttons.register" })
      .getAttribute("href")
  ).toBe("/signup");
  await enterEmail();
  expect(input("password")).toBeTruthy();
});

test("shows all three social providers as unavailable instead of pretending to authenticate", async () => {
  renderLogin();
  for (const name of ["Google", "Microsoft", "Apple"]) {
    const button = screen.getByRole("button", { name });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
  }
  expect(screen.getByText("loginExperience.socialSoon")).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
  await act(async () => {});
});

test("changing language persists the preference without losing the filled form", async () => {
  renderLogin();
  await enterEmail();
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  fireEvent.click(
    screen.getByRole("button", { name: "mainDrawer.appBar.i18n.language" })
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "English" }));
  await waitFor(() => expect(i18n.changeLanguage).toHaveBeenCalledWith("en"));
  expect(localStorage.getItem("language")).toBe("en");
  expect(input("password").value).toBe("ExamplePass9");
  expect(screen.getByText("person@example.com")).toBeTruthy();
});

test("renders translated email-not-found errors and permits retry", async () => {
  api.post.mockRejectedValueOnce({
    response: { data: { error: "ERR_EMAIL_NOT_FOUND" } }
  });
  renderLogin();
  fireEvent.change(input("email"), {
    target: { value: "missing@example.com" }
  });
  fireEvent.submit(input("email").closest("form"));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "login.errors.emailNotFound"
  );
  expect(input("email").disabled).toBe(false);
  expect(toastError).not.toHaveBeenCalled();
});

test("rejects executable and malformed login footer links", () => {
  expect(parseLoginLinks("invalid")).toEqual([]);
  expect(
    parseLoginLinks(
      JSON.stringify([
        { title: "Unsafe", url: "javascript:alert(1)" },
        { title: "Support", url: "https://example.com" },
        { title: 1, url: "https://example.com" }
      ])
    )
  ).toEqual([{ title: "Support", url: "https://example.com" }]);
});

test.each(["resolve", "reject"])(
  "ignores identify completion after the login page unmounts (%s)",
  async outcome => {
    let finish;
    api.post.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          finish = outcome === "resolve" ? resolve : reject;
        })
    );
    const { unmount } = renderLogin();
    fireEvent.change(input("email"), {
      target: { value: "person@example.com" }
    });
    fireEvent.submit(input("email").closest("form"));
    unmount();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () =>
        finish(
          outcome === "resolve"
            ? { data: { proxima_etapa: "senha" } }
            : new Error("Late response")
        )
      );
      expect(errorSpy).not.toHaveBeenCalled();
      expect(toastError).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  }
);

test("does not update login state after successful authentication navigates away", async () => {
  const { unmount } = renderLogin();
  await enterEmail();
  auth.handleLogin.mockImplementationOnce(async () => {
    unmount();
  });
  fireEvent.change(input("password"), { target: { value: "ExamplePass9" } });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => fireEvent.submit(input("password").closest("form")));
    expect(auth.handleLogin).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  } finally {
    errorSpy.mockRestore();
  }
});
