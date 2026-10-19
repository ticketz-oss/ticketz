import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import ReCAPTCHA from "react-google-recaptcha";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Bot,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  Zap
} from "lucide-react";
import config from "../../services/config";
import { openApi, getBrowserTimezone } from "../../services/api";
import { i18n } from "../../translate/i18n";
import {
  AI_ADDONS,
  WHATSAPP_MODES,
  assetUrl,
  formatMoney,
  getEnterpriseUpgrade,
  useBrandColors,
  useLandingRoot,
  usePublicPlans,
  useSignupAllowed
} from "../LandingPage/plans";
import "../LandingPage/styles.css";
import "./styles.css";
import "./refinement.css";
import "./setup.css";
import { isReservedSlug, slugFromName, tenantLoginUrl } from "./setup";
import Summary from "./Summary";
import BrandingPreview from "./BrandingPreview";

const t = (key, options) => i18n.t(`landing.checkout.${key}`, options);
const mt = (key, options) => i18n.t(`landing.motion.checkout.${key}`, options);
const lt = (key, options) => i18n.t(`landing.${key}`, options);
const list = key => i18n.t(`landing.${key}`, { returnObjects: true });

const brandIcon = assetUrl("/branding/espaco-whats-icon.png");
const MODE_IMAGES = {
  official: "/branding/checkout/oficial.webp",
  unofficial: "/branding/checkout/qrcode.webp"
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const selectWithKeyboard = event => {
  if (
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End"
    ].includes(event.key)
  )
    return;
  const choices = Array.from(
    event.currentTarget.querySelectorAll('[role="radio"]')
  );
  const current = choices.indexOf(event.target);
  if (current < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? choices.length - 1
        : (current +
            (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) +
            choices.length) %
          choices.length;
  choices[next].focus();
  choices[next].click();
};

const planLabel = plan =>
  plan && plan.tier && plan.tier !== "custom"
    ? lt(`plans.tiers.${plan.tier}.name`)
    : plan?.name;

const formatPhone = digits => {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const readQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("conexao");
  return {
    planId: Number(params.get("plano") || params.get("planId")) || null,
    mode: WHATSAPP_MODES.includes(mode) ? mode : null
  };
};

const writeQuery = (planId, mode) => {
  const params = new URLSearchParams();
  if (planId) params.set("plano", planId);
  if (mode) params.set("conexao", mode);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`
  );
};

const Stepper = ({ step, onJump }) => {
  const steps = list("checkout.steps");
  return (
    <ol
      className="co-stepper"
      aria-label={t("stepOf", { current: step + 1, total: steps.length })}
    >
      {steps.map((label, index) => {
        const state =
          index < step ? "done" : index === step ? "current" : "todo";
        return (
          <li key={label} className={`is-${state}`}>
            <button
              type="button"
              onClick={() => onJump(index)}
              disabled={index >= step}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="co-step-dot">
                {state === "done" ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="co-step-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

const PlanStep = ({
  plans,
  status,
  planId,
  setPlanId,
  aiAddon,
  setAiAddon
}) => {
  const selected = plans.find(plan => plan.id === planId);
  const enterprise = plans.find(plan => plan.tier === "enterprise");
  const addonValue =
    selected && !selected.aiIncluded
      ? AI_ADDONS.find(addon => addon.id === aiAddon)?.value || 0
      : 0;
  const upgrade = getEnterpriseUpgrade(
    selected,
    enterprise,
    Number(selected?.value) + addonValue
  );
  return (
    <div>
      <h1 className="co-title">{t("plan.title")}</h1>
      <p className="co-lead">{t("plan.description")}</p>
      {status === "loading" && <p className="co-muted">{t("loadingPlans")}</p>}
      {(status === "error" || status === "empty") && (
        <p className="co-alert">{lt("plans.unavailable")}</p>
      )}
      <div
        className="co-plan-list"
        role="radiogroup"
        onKeyDown={selectWithKeyboard}
        aria-label={t("plan.title")}
      >
        {plans.map(plan => {
          const active = plan.id === planId;
          const tier = plan.tier !== "custom" ? plan.tier : null;
          const featured = tier === "enterprise";
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              key={plan.id}
              className={`co-plan ${active ? "is-active" : ""} ${
                featured ? "co-plan--featured" : ""
              }`}
              onClick={() => setPlanId(plan.id)}
            >
              {featured && (
                <span className="co-plan-flag">
                  {lt("plans.enterprise.badge")}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="co-plan-ring"
                  className="co-plan-ring"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="co-radio" aria-hidden="true">
                {active && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="co-plan-main">
                <span className="co-plan-phase">
                  {lt(`plans.phases.${plan.tier || "custom"}`)}
                </span>
                <strong>{planLabel(plan)}</strong>
                <small>
                  {tier
                    ? lt(`plans.tiers.${tier}.pitch`)
                    : lt("plans.customPitch")}
                </small>
                <span className="co-plan-meta">
                  <span>{lt("plans.users", { count: plan.users })}</span>
                  <span>
                    {lt("plans.connections", { count: plan.connections })}
                  </span>
                  <span>{lt("plans.queues", { count: plan.queues })}</span>
                </span>
                {featured && (
                  <span className="co-plan-exclusive">
                    {list("plans.enterprise.exclusive").map(item => (
                      <span key={item.id}>
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                        {item.title}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className="co-plan-price">
                <strong>{formatMoney(plan.value, plan.currency)}</strong>
                <small>{lt("plans.perMonth")}</small>
                <span
                  className={`co-plan-ai ${plan.aiIncluded ? "is-included" : ""}`}
                >
                  <Bot size={14} />
                  {plan.aiIncluded
                    ? lt("plans.aiUnlimited")
                    : lt("plans.aiSeparate")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {selected && !selected.aiIncluded && (
          <motion.fieldset
            className="co-addons"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <legend>{t("plan.aiTitle")}</legend>
            <p className="co-muted">{t("plan.aiDescription")}</p>
            <div className="co-chips">
              <label className={`co-chip ${!aiAddon ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="aiAddon"
                  checked={!aiAddon}
                  onChange={() => setAiAddon(null)}
                />
                {t("plan.aiNone")}
              </label>
              {AI_ADDONS.map(addon => (
                <label
                  key={addon.id}
                  className={`co-chip ${aiAddon === addon.id ? "is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="aiAddon"
                    checked={aiAddon === addon.id}
                    onChange={() => setAiAddon(addon.id)}
                  />
                  <span>
                    <strong>{lt(`addons.items.${addon.id}.name`)}</strong>
                    <small>
                      + {formatMoney(addon.value)}
                      {lt("plans.perMonth")}
                    </small>
                    <em>{lt(`addons.items.${addon.id}.includes`)}</em>
                  </span>
                </label>
              ))}
            </div>
          </motion.fieldset>
        )}
      </AnimatePresence>
      {upgrade && (
        <aside className="co-upsell" aria-labelledby="co-upsell-title">
          <h2 id="co-upsell-title">
            {t("plan.upsell.title", {
              price: formatMoney(upgrade.delta, enterprise.currency)
            })}
          </h2>
          <ul>
            {upgrade.capacities.map(({ key, extra }) => (
              <li key={key}>
                <Check size={15} strokeWidth={3} aria-hidden="true" />
                {t(`plan.upsell.capacity.${key}`, { count: extra })}
              </li>
            ))}
            {!selected.aiIncluded && (
              <li>
                <Check size={15} strokeWidth={3} aria-hidden="true" />
                {t("plan.upsell.aiIncluded")}
              </li>
            )}
            {list("plans.enterprise.exclusive").map(item => (
              <li key={item.id}>
                <Check size={15} strokeWidth={3} aria-hidden="true" />
                {item.title}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="co-btn co-upsell-action"
            onClick={() => setPlanId(enterprise.id)}
          >
            {t("plan.upsell.action")}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <p>{t("plan.upsell.note")}</p>
        </aside>
      )}
    </div>
  );
};

const ModeStep = ({ mode, setMode }) => {
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <h1 className="co-title">{t("mode.title")}</h1>
      <p className="co-lead">{t("mode.description")}</p>
      <div
        className="co-modes"
        role="radiogroup"
        onKeyDown={selectWithKeyboard}
        aria-label={t("mode.title")}
      >
        {WHATSAPP_MODES.map(key => {
          const active = mode === key;
          const BadgeIcon = key === "official" ? ShieldCheck : Zap;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              key={key}
              className={`co-mode co-mode--${key} ${active ? "is-active" : ""}`}
              onClick={() => setMode(key)}
            >
              <span className="co-mode-badge">
                <BadgeIcon size={14} />
                {t(`mode.${key}Badge`)}
              </span>
              <motion.img
                src={assetUrl(MODE_IMAGES[key])}
                alt=""
                width="200"
                height="200"
                animate={
                  active && !reduceMotion
                    ? { scale: [1, 1.12, 1.04], rotate: [0, -4, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
              <strong>{lt(`modes.${key}.title`)}</strong>
              <span className="co-mode-desc">{mt(`${key}Short`)}</span>
              <ul>
                {mt(`${key}Points`, { returnObjects: true }).map(point => (
                  <li key={point}>
                    <Check size={15} />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="co-mode-select">
                {mt(active ? "selected" : "select")}
                {active ? <Check size={16} /> : <ArrowRight size={16} />}
              </span>
              <span className="co-mode-check" aria-hidden="true">
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 600,
                        damping: 22
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
          );
        })}
      </div>
      <div className="co-shared-note">
        <Layers size={20} />
        <div>
          <strong>{mt("sameFeatures")}</strong>
          <p>{mt("sameDescription")}</p>
        </div>
      </div>
      <details className="co-connection-details">
        <summary>{mt("connectionDetails")}</summary>
        {WHATSAPP_MODES.map(key => (
          <p key={key}>
            <strong>{t(`modeNames.${key}`)}. </strong>
            {lt(`modes.${key}.note`)}
          </p>
        ))}
      </details>
    </div>
  );
};

const Field = ({ id, label, error, hint, children }) => (
  <div className={`co-field ${error ? "has-error" : ""}`}>
    <label htmlFor={id}>{label}</label>
    {children}
    {error ? (
      <span className="co-field-error" id={`${id}-error`} role="alert">
        {error}
      </span>
    ) : (
      hint && (
        <span className="co-field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )
    )}
  </div>
);

const DataStep = ({ form, setField, errors, submitError }) => {
  const [showPassword, setShowPassword] = useState(false);
  const describedBy = (id, hint) =>
    errors[id] ? `co-${id}-error` : hint ? `co-${id}-hint` : undefined;
  return (
    <div>
      <h1 className="co-title">{mt("accountTitle")}</h1>
      <p className="co-lead">{mt("accountDescription")}</p>
      <p className="co-free-notice">
        <ShieldCheck size={20} />
        {mt("freeTrial")}
      </p>
      {submitError && (
        <p className="co-alert" role="alert">
          {submitError}
        </p>
      )}
      <div className="co-form">
        <span className="co-form-kicker">
          <Layers size={15} />
          {mt("accountGroup")}
        </span>
        <Field id="co-company" label={t("data.company")} error={errors.company}>
          <input
            id="co-company"
            placeholder={mt("companyPlaceholder")}
            required
            autoComplete="organization"
            value={form.company}
            onChange={event => setField("company", event.target.value)}
            aria-invalid={!!errors.company}
            aria-describedby={describedBy("company")}
          />
        </Field>
        <Field
          id="co-slug"
          label={mt("slugLabel")}
          error={errors.slug}
          hint={mt("slugHint")}
        >
          <input
            id="co-slug"
            autoComplete="off"
            value={form.slug}
            onChange={event =>
              setField("slug", event.target.value.toLowerCase())
            }
            aria-invalid={!!errors.slug}
            aria-describedby={describedBy("slug", true)}
          />
        </Field>
        <Field id="co-email" label={t("data.email")} error={errors.email}>
          <input
            id="co-email"
            placeholder={mt("emailPlaceholder")}
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={event => setField("email", event.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
          />
        </Field>
        <Field id="co-phone" label={t("data.phone")} error={errors.phone}>
          <div className="co-input-prefix">
            <span>+55</span>
            <input
              id="co-phone"
              required
              type="tel"
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="(11) 91234-5678"
              value={formatPhone(form.phone)}
              onChange={event =>
                setField(
                  "phone",
                  event.target.value.replace(/\D/g, "").slice(0, 11)
                )
              }
              aria-invalid={!!errors.phone}
              aria-describedby={describedBy("phone")}
            />
          </div>
        </Field>
        <span className="co-form-kicker co-form-kicker--access">
          <ShieldCheck size={15} />
          {mt("accessGroup")}
        </span>
        <Field
          id="co-password"
          label={t("data.password")}
          error={errors.password}
          hint={t("data.passwordHint")}
        >
          <div className="co-input-action">
            <input
              id="co-password"
              placeholder={mt("passwordPlaceholder")}
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={event => setField("password", event.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={describedBy("password", true)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              aria-label={
                showPassword ? t("data.hidePassword") : t("data.showPassword")
              }
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Field
          id="co-dueDay"
          label={mt("dueDayLabel")}
          error={errors.dueDay}
          hint={mt("dueDayHint")}
        >
          <select
            id="co-dueDay"
            value={form.dueDay}
            onChange={event => setField("dueDay", Number(event.target.value))}
            aria-invalid={!!errors.dueDay}
            aria-describedby={describedBy("dueDay", true)}
          >
            {Array.from({ length: 31 }, (_, index) => (
              <option value={index + 1} key={index}>
                {mt("dueDayOption", { day: index + 1 })}
              </option>
            ))}
          </select>
        </Field>
        <p className="co-billing-explanation">{mt("billingPolicy")}</p>
        <div className={`co-terms ${errors.terms ? "has-error" : ""}`}>
          <label>
            <input
              type="checkbox"
              id="co-terms"
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "co-terms-error" : undefined}
              checked={form.terms}
              onChange={event => setField("terms", event.target.checked)}
            />
            <span>
              {t("data.termsPrefix")}{" "}
              <a href="/termos/" target="_blank" rel="noreferrer">
                {t("data.termsLink")}
              </a>{" "}
              {t("data.termsJoin")}{" "}
              <a href="/privacidade/" target="_blank" rel="noreferrer">
                {t("data.privacyLink")}
              </a>
            </span>
          </label>
          {errors.terms && (
            <span className="co-field-error" id="co-terms-error" role="alert">
              {errors.terms}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ImageChoice = ({ field, file, onChange, preview }) => (
  <div className="co-image-choice">
    <div className={`co-image-preview co-image-preview--${field}`}>
      {preview ? (
        <img src={preview} alt={mt(`identity.${field}.label`)} />
      ) : (
        <Layers size={26} aria-hidden="true" />
      )}
    </div>
    <div>
      <label htmlFor={`co-image-${field}`}>
        {mt(`identity.${field}.label`)}
      </label>
      <p>{mt(`identity.${field}.hint`)}</p>
      <input
        id={`co-image-${field}`}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={event => {
          onChange(field, event.target.files?.[0] || null);
          event.target.value = "";
        }}
      />
      {file && (
        <button
          type="button"
          className="co-remove-image"
          onClick={() => onChange(field, null)}
        >
          {mt("identity.remove")}
        </button>
      )}
    </div>
  </div>
);

const IdentityStep = ({
  form,
  setField,
  files,
  onFile,
  errors,
  submitError
}) => {
  const [previews, setPreviews] = useState({});
  useEffect(() => {
    const urls = Object.fromEntries(
      Object.entries(files)
        .filter(([, file]) => file)
        .map(([key, file]) => [key, URL.createObjectURL(file)])
    );
    setPreviews(urls);
    return () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  return (
    <div>
      <h1 className="co-title">{mt("identity.title")}</h1>
      <p className="co-lead">{mt("identity.description")}</p>
      {submitError && (
        <p className="co-alert" role="alert">
          {submitError}
        </p>
      )}
      <div className="co-identity-fields">
        {Object.keys(files).map(field => (
          <ImageChoice
            key={field}
            field={field}
            file={files[field]}
            preview={previews[field]}
            onChange={onFile}
          />
        ))}
        {errors.image && (
          <p className="co-alert" role="alert">
            {errors.image}
          </p>
        )}
        <Field id="co-primaryColor" label={mt("identity.color")}>
          <input
            id="co-primaryColor"
            type="color"
            value={form.primaryColor}
            onChange={event => setField("primaryColor", event.target.value)}
          />
        </Field>
      </div>
      <BrandingPreview
        images={previews}
        name={form.company}
        color={form.primaryColor}
        slug={form.slug}
      />
      <p className="co-free-notice">
        <ShieldCheck size={20} />
        {mt("freeTrial")}
      </p>
    </div>
  );
};

const Success = ({ email, mode, company }) => {
  const reduceMotion = useReducedMotion();
  const bubbles = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <motion.div
      className="co-success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="co-success-mark" aria-hidden="true">
        {!reduceMotion &&
          bubbles.map(index => {
            const angle = (index / bubbles.length) * Math.PI * 2;
            return (
              <motion.span
                key={index}
                className={`co-burst co-burst--${index % 3}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * 110,
                  y: Math.sin(angle) * 110,
                  scale: [0, 1, 0.8],
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
              />
            );
          })}
        <svg viewBox="0 0 96 96" width="96" height="96">
          <motion.circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.path
            d="M28 50 L42 63 L68 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
        </svg>
      </div>
      <h1 className="co-title">{t("success.title")}</h1>
      <p className="co-lead">{t("success.description", { email })}</p>
      <p className="co-success-next">{t(`success.${mode || "unofficial"}`)}</p>
      <p className="co-lead">
        {mt("trialSuccess", {
          date: company?.trialExpiresAt
            ? new Date(company.trialExpiresAt).toLocaleDateString("pt-BR")
            : ""
        })}
      </p>
      <a
        className="co-btn"
        href={tenantLoginUrl(
          company?.slug,
          window.location,
          config.APP_BASE_DOMAIN
        )}
      >
        {t("success.login")}
      </a>
    </motion.div>
  );
};

const Disabled = () => {
  const whatsappNumber = String(config.LANDING_WHATSAPP_NUMBER || "").replace(
    /\D/g,
    ""
  );
  return (
    <div className="co-success">
      <h1 className="co-title">{t("disabled.title")}</h1>
      <p className="co-lead">{t("disabled.description")}</p>
      {whatsappNumber ? (
        <a
          className="co-btn"
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            lt("contact.whatsappMessage")
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("disabled.talk")}
        </a>
      ) : (
        <a className="co-btn co-btn--ghost" href="/">
          {t("backToSite")}
        </a>
      )}
    </div>
  );
};

const validate = form => {
  const errors = {};
  if (form.company.trim().length < 2) errors.company = t("errors.company");
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = t("errors.email");
  if (form.phone.length < 10) errors.phone = t("errors.phone");
  if (form.password.length < 6) errors.password = t("errors.password");
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(form.slug))
    errors.slug = mt("slugError");
  else if (isReservedSlug(form.slug))
    errors.slug = t("errors.ERR_COMPANY_SLUG_RESERVED");
  if (!Number.isInteger(form.dueDay) || form.dueDay < 1 || form.dueDay > 31)
    errors.dueDay = mt("dueDayError");
  if (!form.terms) errors.terms = t("errors.terms");
  return errors;
};

const errorMessage = err => {
  const code = err?.response?.data?.error || err?.response?.data?.message;
  if (code && i18n.exists(`landing.checkout.errors.${code}`)) {
    return t(`errors.${code}`);
  }
  return t("errors.generic");
};

const Checkout = () => {
  useLandingRoot();
  const brandStyle = useBrandColors();
  const reduceMotion = useReducedMotion();
  const { plans, status } = usePublicPlans();
  const allowed = useSignupAllowed();
  const initial = useMemo(readQuery, []);
  const [planId, setPlanId] = useState(initial.planId);
  const [aiAddon, setAiAddon] = useState(null);
  const [mode, setMode] = useState(initial.mode);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    company: "",
    email: "",
    phone: "",
    password: "",
    slug: "",
    dueDay: 5,
    primaryColor: "#5000ff",
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdCompany, setCreatedCompany] = useState(null);
  const [files, setFiles] = useState({
    logo: null,
    banner: null,
    sideImage: null
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const captchaRef = useRef(null);
  const headingRef = useRef(null);

  const plan = plans.find(item => item.id === planId) || null;

  // A link from the pricing table already carries the plan: skip to step 2.
  useEffect(() => {
    if (status !== "ready") return;
    if (planId && !plans.some(item => item.id === planId)) {
      setPlanId(null);
      return;
    }
    if (initial.planId && plans.some(item => item.id === initial.planId)) {
      setStep(initial.mode ? 2 : 1);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    writeQuery(planId, mode);
  }, [planId, mode]);

  useEffect(() => {
    if (plan?.aiIncluded) setAiAddon(null);
  }, [plan]);

  useEffect(() => {
    document.getElementById("root")?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  const goTo = next => {
    if (submitting) return;
    setDirection(next > step ? 1 : -1);
    setStepError("");
    setStep(next);
  };

  const setField = (key, value) => {
    if (key === "slug") setSlugEdited(true);
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === "company" && !slugEdited ? { slug: slugFromName(value) } : {})
    }));
    if (errors[key]) setErrors(current => ({ ...current, [key]: undefined }));
  };

  const onFile = (key, file) => {
    if (
      file &&
      (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024)
    ) {
      setErrors(current => ({
        ...current,
        image: mt("identity.invalidImage")
      }));
      return;
    }
    setErrors(current => ({ ...current, image: undefined }));
    setFiles(current => ({ ...current, [key]: file }));
  };

  const submit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`co-${first}`)?.focus();
      goTo(2);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        name: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        phone: `55${form.phone}`,
        password: form.password,
        planId: plan.id,
        recurrence: "MENSAL",
        status: true,
        campaignsEnabled: true,
        timezone: getBrowserTimezone() || null,
        whatsappMode: mode,
        aiAddon: plan.aiIncluded ? null : aiAddon
      };
      payload.dueDay = form.dueDay;
      payload.slug = form.slug;
      payload.primaryColor = form.primaryColor;
      if (config.RECAPTCHA_SITE_KEY) {
        try {
          payload.captchaToken = await captchaRef.current.executeAsync();
        } catch (_) {
          throw new Error("captcha");
        }
      }
      const body = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) body.append(key, value);
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) body.append(key, file);
      });
      const response = await openApi.post("/companies/cadastro", body);
      setCreatedCompany(response.data);
      setDone(true);
    } catch (err) {
      setSubmitError(
        err?.message === "captcha" ? t("errors.captcha") : errorMessage(err)
      );
      captchaRef.current?.reset?.();
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (submitting) return;
    if (step === 0 && !plan) return setStepError(t("errors.plan"));
    if (step === 1 && !mode) return setStepError(t("errors.mode"));
    if (step === 2) {
      const found = validate(form);
      setErrors(found);
      if (Object.keys(found).length) {
        document.getElementById(`co-${Object.keys(found)[0]}`)?.focus();
        return;
      }
    }
    if (step === 3) return submit();
    return goTo(step + 1);
  };

  return (
    <div className={`checkout-page co-step-${step}`} style={brandStyle}>
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="robots" content="noindex" />
        <link rel="icon" type="image/png" href={brandIcon} />
      </Helmet>
      <header className="co-header">
        <a href="/" className="co-logo">
          <img src={brandIcon} alt="" width="32" height="32" />
          <strong>
            Espaço<span>Whats</span>
          </strong>
        </a>
        {!done && allowed !== false && <Stepper step={step} onJump={goTo} />}
        <a href="/" className="co-back-site">
          <ArrowLeft size={16} />
          {t("backToSite")}
        </a>
      </header>

      <main className="co-main" tabIndex={-1} ref={headingRef}>
        {allowed === false ? (
          <Disabled />
        ) : done ? (
          <Success
            email={form.email.trim().toLowerCase()}
            mode={mode}
            company={createdCompany}
          />
        ) : (
          <div className="co-layout">
            <form
              className="co-panel"
              noValidate
              onSubmit={event => {
                event.preventDefault();
                next();
              }}
            >
              <motion.div
                key={step}
                initial={
                  reduceMotion ? false : { opacity: 0, x: direction * 56 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && (
                  <PlanStep
                    plans={plans}
                    status={status}
                    planId={planId}
                    setPlanId={id => {
                      setPlanId(id);
                      setStepError("");
                    }}
                    aiAddon={aiAddon}
                    setAiAddon={setAiAddon}
                  />
                )}
                {step === 1 && (
                  <ModeStep
                    mode={mode}
                    setMode={value => {
                      setMode(value);
                      setStepError("");
                    }}
                  />
                )}
                {step === 2 && (
                  <DataStep
                    form={form}
                    setField={setField}
                    errors={errors}
                    submitError={submitError}
                  />
                )}
                {step === 3 && (
                  <IdentityStep
                    form={form}
                    setField={setField}
                    files={files}
                    onFile={onFile}
                    errors={errors}
                    submitError={submitError}
                  />
                )}
              </motion.div>
              {stepError && (
                <p className="co-alert" role="alert">
                  {stepError}
                </p>
              )}
              <div className="co-actions">
                {step > 0 && (
                  <button
                    type="button"
                    className="co-btn co-btn--ghost"
                    onClick={() => goTo(step - 1)}
                    disabled={submitting}
                  >
                    {t("back")}
                  </button>
                )}
                <button
                  type="submit"
                  className="co-btn co-next"
                  disabled={submitting || (step === 3 && allowed === null)}
                >
                  {submitting && <LoaderCircle size={18} className="co-spin" />}
                  {step === 3
                    ? submitting
                      ? t("data.submitting")
                      : t("data.submit")
                    : t("continue")}
                  {!submitting && <ArrowRight size={17} />}
                </button>
              </div>
              {step >= 2 && (
                <div className="co-form-footnote">
                  <span>{mt("formNote")}</span>
                  <p>
                    {mt("already")} <a href="/login">{mt("login")}</a>
                  </p>
                </div>
              )}
              {config.RECAPTCHA_SITE_KEY && (
                <ReCAPTCHA
                  ref={captchaRef}
                  size="invisible"
                  sitekey={config.RECAPTCHA_SITE_KEY}
                />
              )}
            </form>
            <Summary
              plan={plan}
              mode={mode}
              aiAddon={aiAddon}
              onEdit={goTo}
              dueDay={form.dueDay}
            />
          </div>
        )}
      </main>
      <footer className="co-footer">
        <span>
          {mt("footerBrand")} {mt("footer")}
        </span>
        <nav>
          <a href="/privacidade/">{t("data.privacyLink")}</a>
          <a href="/termos/">{t("data.termsLink")}</a>
        </nav>
      </footer>
    </div>
  );
};

export default Checkout;
