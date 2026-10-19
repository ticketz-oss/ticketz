import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { i18n } from "../../translate/i18n";
import "./sign-in.css";

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onGoogleSignIn?: () => void;
  onMicrosoftSignIn?: () => void;
  onAppleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  step?: "email" | "password" | "createPassword";
  values?: {
    email: string;
    password: string;
    newPassword: string;
    confirmPassword: string;
  };
  onFieldChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeEmail?: () => void;
  busy?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  error?: string;
  labels?: Record<string, string>;
  toolbar?: React.ReactNode;
  hero?: React.ReactNode;
  footer?: React.ReactNode;
  registration?: React.ReactNode;
  authContent?: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
  className?: string;
  rememberMe?: boolean;
  onRememberMeChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GlassInputWrapper = ({
  children
}: {
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/5">
    {children}
  </div>
);

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.86 23.86 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#f35325" d="M2 2h9v9H2z" />
      <path fill="#81bc06" d="M13 2h9v9h-9z" />
      <path fill="#05a6f0" d="M2 13h9v9H2z" />
      <path fill="#ffba08" d="M13 13h9v9h-9z" />
    </svg>
  );
}

function TestimonialCard({
  testimonial,
  delay
}: {
  testimonial: Testimonial;
  delay: string;
}) {
  return (
    <div
      className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
    >
      <img
        src={testimonial.avatarSrc}
        className="h-10 w-10 object-cover rounded-2xl"
        alt={testimonial.name}
      />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium">
          {testimonial.name}
        </p>
        <p className="text-muted-foreground">{testimonial.handle}</p>
        <p className="mt-1 text-foreground/80">{testimonial.text}</p>
      </div>
    </div>
  );
}

export function SignInPage({
  title,
  description,
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onMicrosoftSignIn,
  onAppleSignIn,
  onResetPassword,
  onCreateAccount,
  step = "email",
  values,
  onFieldChange,
  onChangeEmail,
  busy = false,
  submitDisabled = false,
  submitLabel,
  error,
  labels = {},
  toolbar,
  hero,
  footer,
  registration,
  authContent,
  dark = false,
  style,
  className = "",
  rememberMe,
  onRememberMeChange
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const label = (key: string, translation: string) =>
    labels[key] ?? i18n.t(translation);
  const inputClass =
    "w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-60";

  const passwordField = (
    name: "password" | "newPassword" | "confirmPassword",
    required: boolean,
    delay: string
  ) => (
    <div className={`animate-element ${delay}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-muted-foreground"
      >
        {label(name, `login.form.${name}`)}
      </label>
      <GlassInputWrapper>
        <div className="relative">
          <input
            id={name}
            name={name}
            type={showPassword ? "text" : "password"}
            placeholder={label(name, `login.form.${name}`)}
            className={`${inputClass} pr-12`}
            value={values?.[name]}
            onChange={onFieldChange}
            required={required}
            disabled={busy}
            autoComplete={
              name === "password" ? "current-password" : "new-password"
            }
            autoFocus={
              (name === "password" && step === "password") ||
              name === "newPassword"
            }
            aria-describedby={
              name === "confirmPassword" ? "password-strength-hint" : undefined
            }
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowPassword(current => !current)}
            className="absolute inset-y-0 right-3 flex items-center disabled:opacity-50"
            aria-label={label(
              showPassword ? "hidePassword" : "showPassword",
              `loginExperience.${showPassword ? "hidePassword" : "showPassword"}`
            )}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        </div>
      </GlassInputWrapper>
      {name === "confirmPassword" && (
        <p
          id="password-strength-hint"
          className="mt-2 text-xs text-muted-foreground"
        >
          {label("passwordStrength", "login.form.passwordStrength")}
        </p>
      )}
    </div>
  );

  const providers = [
    { name: "Google", action: onGoogleSignIn, icon: <GoogleIcon /> },
    { name: "Microsoft", action: onMicrosoftSignIn, icon: <MicrosoftIcon /> },
    {
      name: "Apple",
      action: onAppleSignIn,
      icon: <FaApple className="h-5 w-5 shrink-0" aria-hidden="true" />
    }
  ];
  const socialUnavailable = providers.every(provider => !provider.action);

  return (
    <div
      className={`ew-sign-in${dark ? " dark" : ""}${className ? ` ${className}` : ""}`}
      role="main"
      style={style}
    >
      <div className="min-h-[100dvh] flex flex-col md:flex-row font-geist w-full">
        <section className="ew-sign-in-form flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md">
            {toolbar && (
              <div className="ew-sign-in-toolbar mb-12">{toolbar}</div>
            )}
            <div className="flex flex-col gap-6">
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                {title ?? i18n.t("loginExperience.welcome")}
              </h1>
              <p className="animate-element animate-delay-200 text-muted-foreground">
                {description ?? i18n.t("loginExperience.emailHint")}
              </p>
              {authContent ?? (
                <>
                  <form
                    className="space-y-5"
                    aria-label={i18n.t("login.title")}
                    aria-busy={busy}
                    onSubmit={event => {
                      event.preventDefault();
                      if (!busy && !submitDisabled) onSignIn?.(event);
                    }}
                  >
                    {step === "email" ? (
                      <div className="animate-element animate-delay-300">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {label("email", "login.form.email")}
                        </label>
                        <GlassInputWrapper>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={label("email", "login.form.email")}
                            className={inputClass}
                            value={values?.email}
                            onChange={onFieldChange}
                            autoComplete="username"
                            required
                            disabled={busy}
                          />
                        </GlassInputWrapper>
                      </div>
                    ) : (
                      <div className="animate-element animate-delay-300 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="break-all">{values?.email}</span>
                        {onChangeEmail && (
                          <button
                            type="button"
                            disabled={busy}
                            className="text-primary hover:underline disabled:opacity-50"
                            onClick={() => {
                              setShowPassword(false);
                              onChangeEmail();
                            }}
                          >
                            {label("changeEmail", "login.buttons.changeEmail")}
                          </button>
                        )}
                      </div>
                    )}
                    {step === "createPassword" ? (
                      <>
                        {passwordField(
                          "newPassword",
                          true,
                          "animate-delay-400"
                        )}
                        {passwordField(
                          "confirmPassword",
                          true,
                          "animate-delay-500"
                        )}
                      </>
                    ) : (
                      passwordField(
                        "password",
                        step === "password",
                        "animate-delay-400"
                      )
                    )}
                    {step === "email" && (
                      <p className="animate-element animate-delay-500 text-xs text-muted-foreground">
                        {label(
                          "firstAccessHint",
                          "loginExperience.firstAccessHint"
                        )}
                      </p>
                    )}
                    {(onRememberMeChange || onResetPassword) && (
                      <div className="animate-element animate-delay-500 flex items-center justify-between gap-4 text-sm">
                        {onRememberMeChange && (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="rememberMe"
                              checked={rememberMe}
                              onChange={onRememberMeChange}
                              disabled={busy}
                            />
                            {label(
                              "rememberEmail",
                              "loginExperience.rememberEmail"
                            )}
                          </label>
                        )}
                        {onResetPassword && (
                          <button
                            type="button"
                            onClick={onResetPassword}
                            disabled={busy}
                            className="text-primary hover:underline"
                          >
                            {label(
                              "resetPassword",
                              "loginExperience.resetPassword"
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {error && (
                      <p
                        role="alert"
                        className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200"
                      >
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={busy || submitDisabled}
                      className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {busy
                        ? label("loading", "loginExperience.loading")
                        : (submitLabel ?? i18n.t("login.buttons.submit"))}
                    </button>
                  </form>
                  <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                    <span className="w-full border-t border-border" />
                    <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                      {label("socialDivider", "loginExperience.socialDivider")}
                    </span>
                  </div>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    aria-describedby={
                      socialUnavailable ? "social-coming-soon" : undefined
                    }
                  >
                    {providers.map(provider => (
                      <button
                        key={provider.name}
                        type="button"
                        onClick={provider.action}
                        disabled={busy || !provider.action}
                        className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 text-sm hover:bg-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {provider.icon}
                        {provider.name}
                      </button>
                    ))}
                  </div>
                  {socialUnavailable && (
                    <p
                      id="social-coming-soon"
                      className="animate-element animate-delay-900 text-center text-xs text-muted-foreground"
                    >
                      {label("socialSoon", "loginExperience.socialSoon")}
                    </p>
                  )}
                  {registration ??
                    (onCreateAccount && (
                      <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={onCreateAccount}
                          disabled={busy}
                          className="text-primary hover:underline"
                        >
                          {label("createAccount", "login.buttons.register")}
                        </button>
                      </p>
                    ))}
                </>
              )}
              {footer}
            </div>
          </div>
        </section>
        {hero ? (
          <section className="ew-sign-in-hero hidden md:flex flex-1 relative">
            {hero}
          </section>
        ) : (
          heroImageSrc && (
            <section className="ew-sign-in-hero hidden md:block flex-1 relative p-4">
              <div
                className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImageSrc})` }}
              />
              {testimonials.length > 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
                  {testimonials.slice(0, 3).map((testimonial, index) => (
                    <div
                      key={`${testimonial.name}-${index}`}
                      className={
                        index === 1
                          ? "hidden xl:block"
                          : index === 2
                            ? "hidden 2xl:block"
                            : ""
                      }
                    >
                      <TestimonialCard
                        testimonial={testimonial}
                        delay={`animate-delay-${1000 + index * 200}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
}

export default SignInPage;
