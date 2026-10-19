import ThemeSelector from "../../components/ThemeSelector";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { MenuItem, Menu, IconButton, useTheme } from "@material-ui/core";
import { Globe2 } from "lucide-react";
import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";
import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import useGoogleLogin from "../../hooks/useGoogleLogin";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import getCompanySlug from "../../helpers/getCompanySlug";
import BrandPanel from "../../components/LoginExperience/BrandPanel";
import LoginBrandHeader from "../../components/LoginExperience/LoginBrandHeader";
import { loginBrandStyles } from "../../components/LoginExperience/branding";

import { SignInPage } from "../../components/ui/sign-in";

export const parseLoginLinks = value => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          link =>
            typeof link?.title === "string" &&
            typeof link?.url === "string" &&
            /^https?:\/\//i.test(link.url)
        )
      : [];
  } catch (_) {
    return [];
  }
};

const settingKeys = [
  "primaryColorLight",
  "primaryColorDark",
  "allowSignup",
  "loginPageLinks",
  "loginSidePanelImage",
  "loginBackgroundContent",
  "appLogoLight",
  "appLogoDark",
  "appName",
  "loginHeadline",
  "loginDescription",
  "loginTemplate"
];

export default function Login() {
  const theme = useTheme();
  const { handleLogin, handlePasswordSetup, handleSocialLogin, loading } =
    useContext(AuthContext);
  const google = useGoogleLogin(handleSocialLogin);
  const { getPublicSetting } = useSettings();
  const [branding, setBranding] = useState({});
  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || i18n.language || "en"
  );
  const [user, setUser] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [step, setStep] = useState("email");
  const [activationToken, setActivationToken] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const disabled = loading || busy || google.busy;

  useEffect(() => {
    let active = true;
    mounted.current = true;
    Promise.all(
      settingKeys.map(async key => {
        try {
          return [key, await getPublicSetting(key)];
        } catch (_) {
          return [key, ""];
        }
      })
    ).then(entries => {
      if (active) setBranding(Object.fromEntries(entries));
    });
    return () => {
      active = false;
      mounted.current = false;
    };
    // Public branding is scoped by the host slug, not the previously signed-in company.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChooseLanguage = async lang => {
    setLangMenuAnchor(null);
    localStorage.setItem("language", lang);
    await i18n.changeLanguage(lang);
    if (mounted.current) setLanguage(lang);
  };
  const handleChangeInput = event => {
    setFormError("");
    const { name, value } = event.target;
    setUser(current => ({ ...current, [name]: value }));
  };
  const handleChangeEmail = () => {
    setStep("email");
    setActivationToken("");
    setFormError("");
    setUser(current => ({
      ...current,
      password: "",
      newPassword: "",
      confirmPassword: ""
    }));
  };
  const handleSubmit = async event => {
    event.preventDefault();
    if (submitting.current || disabled) return;
    submitting.current = true;
    setBusy(true);
    setFormError("");
    try {
      if (step === "email") {
        const slug = getCompanySlug();
        const { data } = await api.post("/auth/login/identify", {
          email: user.email.trim(),
          ...(slug ? { slug } : {})
        });
        if (!mounted.current) return;
        if (data.proxima_etapa === "criar_senha") {
          setActivationToken(data.ativacao_token);
          setStep("createPassword");
        } else if (user.password) {
          await handleLogin({
            email: user.email.trim(),
            password: user.password
          });
        } else {
          setStep("password");
        }
      } else if (step === "password") {
        await handleLogin({
          email: user.email.trim(),
          password: user.password
        });
      } else {
        if (user.newPassword !== user.confirmPassword) {
          setFormError(i18n.t("login.errors.passwordMismatch"));
          return;
        }
        if (
          !(
            user.newPassword.length >= 8 &&
            /[a-z]/.test(user.newPassword) &&
            /[A-Z]/.test(user.newPassword) &&
            /[0-9]/.test(user.newPassword)
          )
        ) {
          setFormError(i18n.t("login.errors.passwordStrength"));
          return;
        }
        await handlePasswordSetup({
          token: activationToken,
          password: user.newPassword,
          password_confirmation: user.confirmPassword
        });
      }
    } catch (error) {
      if (!mounted.current) return;
      if (error.response?.data?.error === "ERR_EMAIL_NOT_FOUND")
        setFormError(i18n.t("login.errors.emailNotFound"));
      else toastError(error);
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const title =
    step === "createPassword"
      ? i18n.t("login.buttons.createPassword")
      : i18n.t("loginExperience.welcome");
  const links = parseLoginLinks(branding.loginPageLinks);
  return (
    <>
      <SignInPage
        dark={theme.palette.type === "dark"}
        style={loginBrandStyles(branding, theme.palette.type === "dark")}
        title={google.callback ? i18n.t("socialLogin.title") : title}
        description={
          google.callback
            ? i18n.t("socialLogin.description")
            : i18n.t(
                step === "email"
                  ? "loginExperience.emailHint"
                  : step === "password"
                    ? "loginExperience.passwordHint"
                    : "loginExperience.setupHint"
              )
        }
        step={step}
        values={user}
        onFieldChange={handleChangeInput}
        onChangeEmail={handleChangeEmail}
        onSignIn={handleSubmit}
        onGoogleSignIn={google.ready ? google.start : undefined}
        authContent={
          google.callback ? (
            <div className="space-y-5" aria-busy={google.busy}>
              {google.busy && (
                <p role="status" className="text-muted-foreground">
                  {i18n.t("socialLogin.loading")}
                </p>
              )}
              {google.error && (
                <p
                  role="alert"
                  className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200"
                >
                  {google.error}
                </p>
              )}
              {google.legal && (
                <form onSubmit={google.accept} className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("socialLogin.legalDescription")}
                  </p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      required
                      checked={google.accepted}
                      disabled={google.busy}
                      onChange={event =>
                        google.setAccepted(event.target.checked)
                      }
                      className="mt-1 accent-orange-600"
                    />
                    <span>
                      {i18n.t("socialLogin.accept")}{" "}
                      <a
                        className="text-primary underline"
                        href="https://espacowhats.com.br/termos/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {i18n.t("socialLogin.terms")}
                      </a>{" "}
                      {i18n.t("socialLogin.and")}{" "}
                      <a
                        className="text-primary underline"
                        href="https://espacowhats.com.br/privacidade/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {i18n.t("socialLogin.privacy")}
                      </a>
                      .
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={!google.accepted || google.busy}
                    className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground disabled:opacity-60"
                  >
                    {i18n.t("login.buttons.continue")}
                  </button>
                </form>
              )}
              <div id="clerk-captcha" />
              <RouterLink
                to="/login"
                className="inline-block text-sm text-primary hover:underline"
              >
                {i18n.t("socialLogin.back")}
              </RouterLink>
            </div>
          ) : undefined
        }
        busy={disabled}
        error={formError || google.error}
        submitDisabled={
          (step === "password" && !user.password) ||
          (step === "createPassword" &&
            (!user.newPassword || !user.confirmPassword))
        }
        submitLabel={i18n.t(
          step === "email"
            ? user.password
              ? "login.buttons.submit"
              : "login.buttons.continue"
            : step === "createPassword"
              ? "login.buttons.createPassword"
              : "login.buttons.submit"
        )}
        toolbar={
          <LoginBrandHeader settings={branding}>
            <div className="login-tools">
              <IconButton
                onClick={event => setLangMenuAnchor(event.currentTarget)}
                aria-label={i18n.t("mainDrawer.appBar.i18n.language")}
                aria-haspopup="menu"
              >
                <Globe2 size={20} />
              </IconButton>
              <ThemeSelector />
            </div>
          </LoginBrandHeader>
        }
        hero={<BrandPanel settings={branding} />}
        registration={
          branding.allowSignup === "enabled" && step === "email" ? (
            <RouterLink className="login-register" to="/signup">
              {i18n.t("login.buttons.register")}
            </RouterLink>
          ) : undefined
        }
        footer={
          <footer className="login-footer">
            {links.map((link, index) => (
              <a
                href={link.url}
                key={`${link.url}-${index}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.title}
              </a>
            ))}
          </footer>
        }
      />
      <Menu
        anchorEl={langMenuAnchor}
        open={Boolean(langMenuAnchor)}
        onClose={() => setLangMenuAnchor(null)}
      >
        {Object.keys(messages).map(lang => (
          <MenuItem
            key={lang}
            selected={language === lang}
            onClick={() => handleChooseLanguage(lang)}
          >
            {messages[lang].translations.mainDrawer.appBar.i18n.language}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
