import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SignInPage } from "./sign-in";
import { loginExperienceMessages } from "../../translate/languages/loginExperience";

jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));
const values = {
  email: "person@example.com",
  password: "ExamplePass9",
  newPassword: "",
  confirmPassword: ""
};
const getInput = field => screen.getByLabelText(`login.form.${field}`);

test("only configured Google is enabled while Apple and Microsoft remain unavailable", () => {
  const onGoogleSignIn = jest.fn();
  render(<SignInPage onGoogleSignIn={onGoogleSignIn} />);
  expect(screen.getByRole("button", { name: "Google" }).disabled).toBe(false);
  expect(screen.getByRole("button", { name: "Apple" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Microsoft" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Google" }));
  expect(onGoogleSignIn).toHaveBeenCalledTimes(1);
});

test("custom OAuth continuation preserves shell and replaces password/social forms", () => {
  render(
    <SignInPage
      toolbar={<span>Espaço Whats</span>}
      authContent={<div>Legal consent</div>}
    />
  );
  expect(screen.getByText("Espaço Whats")).toBeTruthy();
  expect(screen.getByText("Legal consent")).toBeTruthy();
  expect(screen.queryByLabelText("login.form.email")).toBeNull();
  expect(screen.queryByRole("button", { name: "Google" })).toBeNull();
});

test("renders translated native fields with accessible labels and optional initial password", () => {
  render(<SignInPage />);
  expect(screen.getByRole("main")).toBeTruthy();
  expect(screen.getByRole("form", { name: "login.title" })).toBeTruthy();
  expect(getInput("email").type).toBe("email");
  expect(getInput("email").required).toBe(true);
  expect(getInput("email").autocomplete).toBe("username");
  expect(getInput("password").required).toBe(false);
  expect(getInput("password").autocomplete).toBe("current-password");
  expect(screen.getByText("loginExperience.firstAccessHint")).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "loginExperience.welcome" })
  ).toBeTruthy();
});

test("forwards controlled field edits and the submit event to real callbacks", () => {
  const onSignIn = jest.fn();
  const onFieldChange = jest.fn();
  render(
    <SignInPage
      values={values}
      onFieldChange={onFieldChange}
      onSignIn={onSignIn}
      submitLabel="Entrar"
    />
  );
  fireEvent.change(getInput("email"), {
    target: { value: "other@example.com" }
  });
  expect(onFieldChange).toHaveBeenCalledTimes(1);
  fireEvent.submit(getInput("email").closest("form"));
  expect(onSignIn).toHaveBeenCalledTimes(1);
  expect(onSignIn.mock.calls[0][0].defaultPrevented).toBe(true);
});

test.each([{ busy: true }, { submitDisabled: true }])(
  "blocks even direct form submits when guarded by %j",
  guard => {
    const onSignIn = jest.fn();
    render(<SignInPage {...guard} onSignIn={onSignIn} />);
    fireEvent.submit(getInput("email").closest("form"));
    expect(onSignIn).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: guard.busy ? "loginExperience.loading" : "login.buttons.submit"
      }).disabled
    ).toBe(true);
  }
);

test("toggles password visibility and resets it when changing email", () => {
  const onChangeEmail = jest.fn();
  const { rerender } = render(
    <SignInPage
      step="password"
      values={values}
      onFieldChange={jest.fn()}
      onChangeEmail={onChangeEmail}
    />
  );
  expect(getInput("password").required).toBe(true);
  expect(document.activeElement).toBe(getInput("password"));
  fireEvent.click(
    screen.getByRole("button", { name: "loginExperience.showPassword" })
  );
  expect(getInput("password").type).toBe("text");
  expect(
    screen
      .getByRole("button", { name: "loginExperience.hidePassword" })
      .getAttribute("aria-pressed")
  ).toBe("true");
  fireEvent.click(
    screen.getByRole("button", { name: "login.buttons.changeEmail" })
  );
  expect(onChangeEmail).toHaveBeenCalledTimes(1);
  rerender(<SignInPage values={values} onFieldChange={jest.fn()} />);
  expect(getInput("password").type).toBe("password");
});

test("renders both required first-access password fields and their strength hint", () => {
  render(
    <SignInPage
      step="createPassword"
      values={values}
      onFieldChange={jest.fn()}
    />
  );
  expect(getInput("newPassword").required).toBe(true);
  expect(document.activeElement).toBe(getInput("newPassword"));
  expect(getInput("confirmPassword").required).toBe(true);
  expect(getInput("confirmPassword").getAttribute("aria-describedby")).toBe(
    "password-strength-hint"
  );
  expect(screen.getByText("login.form.passwordStrength")).toBeTruthy();
  expect(screen.queryByLabelText("login.form.email")).toBeNull();
  expect(screen.getByText(values.email)).toBeTruthy();
});

test("disables all three OAuth providers by default without fake callbacks", () => {
  render(<SignInPage />);
  for (const name of ["Google", "Microsoft", "Apple"])
    expect(screen.getByRole("button", { name }).disabled).toBe(true);
  expect(screen.getByText("loginExperience.socialSoon")).toBeTruthy();
});

test("uses supplied provider actions only and disables them while busy", () => {
  const callbacks = {
    onGoogleSignIn: jest.fn(),
    onMicrosoftSignIn: jest.fn(),
    onAppleSignIn: jest.fn()
  };
  const { rerender } = render(<SignInPage {...callbacks} />);
  for (const name of ["Google", "Microsoft", "Apple"]) {
    fireEvent.click(screen.getByRole("button", { name }));
    expect(callbacks[`on${name}SignIn`]).toHaveBeenCalledTimes(1);
  }
  expect(screen.queryByText("loginExperience.socialSoon")).toBeNull();
  rerender(<SignInPage {...callbacks} busy />);
  for (const name of ["Google", "Microsoft", "Apple"]) {
    fireEvent.click(screen.getByRole("button", { name }));
    expect(callbacks[`on${name}SignIn`]).toHaveBeenCalledTimes(1);
  }
});

test("does not show reset or remember controls without real callbacks", () => {
  render(<SignInPage />);
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText("loginExperience.resetPassword")).toBeNull();
});

test("wires optional remember, reset and account creation callbacks", () => {
  const onRememberMeChange = jest.fn();
  const onResetPassword = jest.fn();
  const onCreateAccount = jest.fn();
  render(
    <SignInPage
      rememberMe={false}
      onRememberMeChange={onRememberMeChange}
      onResetPassword={onResetPassword}
      onCreateAccount={onCreateAccount}
    />
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "loginExperience.rememberEmail" })
  );
  fireEvent.click(
    screen.getByRole("button", { name: "loginExperience.resetPassword" })
  );
  fireEvent.click(
    screen.getByRole("button", { name: "login.buttons.register" })
  );
  expect(onRememberMeChange).toHaveBeenCalledTimes(1);
  expect(onResetPassword).toHaveBeenCalledTimes(1);
  expect(onCreateAccount).toHaveBeenCalledTimes(1);
});

test("prefers the actual hero slot over the stock image and testimonials", () => {
  const { container } = render(
    <SignInPage
      hero={<div>Actual tenant panel</div>}
      heroImageSrc="/unused.png"
      testimonials={[
        {
          avatarSrc: "/avatar.png",
          name: "Example",
          handle: "Example role",
          text: "Example feedback"
        }
      ]}
    />
  );
  expect(screen.getByText("Actual tenant panel")).toBeTruthy();
  expect(container.querySelector('[style*="unused.png"]')).toBeNull();
  expect(screen.queryByText("Example feedback")).toBeNull();
});

test("does not invent testimonial content or load default external images", () => {
  const { container, rerender } = render(<SignInPage />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector(".ew-sign-in-hero")).toBeNull();
  rerender(<SignInPage heroImageSrc="/tenant-background.png" />);
  expect(
    container.querySelector('[style*="tenant-background.png"]')
  ).toBeTruthy();
  expect(container.querySelector(".animate-testimonial")).toBeNull();
});

test("renders only supplied testimonials and names their avatars accessibly", () => {
  render(
    <SignInPage
      heroImageSrc="/tenant-background.png"
      testimonials={[
        {
          avatarSrc: "/avatar.png",
          name: "Ana",
          handle: "Support team",
          text: "Our shared experience"
        }
      ]}
    />
  );
  expect(screen.getByRole("img", { name: "Ana" }).getAttribute("src")).toBe(
    "/avatar.png"
  );
  expect(screen.getByText("Our shared experience")).toBeTruthy();
});

test("supports custom labels, dark scoping and real toolbar/footer/registration slots", () => {
  const { container } = render(
    <SignInPage
      title="Custom title"
      description="Custom introduction"
      labels={{ email: "Seu e-mail", password: "Sua senha" }}
      toolbar={<div>Toolbar</div>}
      footer={<a href="/terms">Terms</a>}
      registration={<a href="/signup">Registration</a>}
      dark
      error="Authentication failed"
    />
  );
  expect(screen.getByLabelText("Seu e-mail")).toBeTruthy();
  expect(screen.getByLabelText("Sua senha")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Authentication failed");
  expect(screen.getByRole("heading", { name: "Custom title" })).toBeTruthy();
  expect(screen.getByText("Toolbar")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Terms" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Registration" })).toBeTruthy();
  expect(container.firstChild.className).toContain("ew-sign-in dark");
});

test("provides translated optional-control labels in all eight supported locales", () => {
  expect(Object.keys(loginExperienceMessages)).toHaveLength(8);
  for (const locale of Object.values(loginExperienceMessages)) {
    expect(locale.loginExperience.rememberEmail).toEqual(expect.any(String));
    expect(locale.loginExperience.resetPassword).toEqual(expect.any(String));
    expect(locale.loginExperience.rememberEmail.length).toBeGreaterThan(0);
    expect(locale.loginExperience.resetPassword.length).toBeGreaterThan(0);
  }
});
