import React from "react";
import { Check, ShieldCheck } from "lucide-react";
import { i18n } from "../../translate/i18n";
import { AI_ADDONS, formatMoney } from "../LandingPage/plans";
import { firstBillingPreview, prorataCents, trialEndPreview } from "./setup";
import "./summary.css";

const t = (key, options) => i18n.t(`landing.checkout.${key}`, options);
const mt = (key, options) => i18n.t(`landing.motion.checkout.${key}`, options);

export default function Summary({ plan, mode, aiAddon, onEdit, dueDay }) {
  const addon = AI_ADDONS.find(item => item.id === aiAddon);
  const total =
    (Number(plan?.value) || 0) +
    (plan && !plan.aiIncluded && addon ? addon.value : 0);
  const planName =
    plan?.tier && plan.tier !== "custom"
      ? i18n.t(`landing.plans.tiers.${plan.tier}.name`)
      : plan?.name;
  const firstDue = firstBillingPreview(dueDay);
  // The first invoice is due on the last trial day and covers only the days
  // until the first due day; the full monthly fee starts on that due day.
  const trialEnd = trialEndPreview();
  const firstChargeDays = Math.round((firstDue - trialEnd) / 86400000);
  const firstCharge = prorataCents(Math.round(total * 100), trialEnd, firstDue);
  const civilDate = date => (
    <time dateTime={date.toISOString().slice(0, 10)}>
      {date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
    </time>
  );
  return (
    <div className="co-sidebar">
      <aside
        className="co-order-summary"
        aria-live="polite"
        aria-labelledby="co-summary-heading"
      >
        <h2 id="co-summary-heading">{mt("summaryLayout.title")}</h2>
        <div className="co-order-trial">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <strong>{mt("summaryLayout.trialTitle")}</strong>
            <p>{mt("summaryLayout.trialText")}</p>
          </div>
        </div>
        <dl className="co-order-selections">
          <div>
            <dt>{t("summary.plan")}</dt>
            <dd>{plan ? planName : mt("summaryPlanPending")}</dd>
            {plan && (
              <button
                type="button"
                onClick={() => onEdit(0)}
                aria-label={mt("summaryLayout.changePlan")}
              >
                {t("summary.change")}
              </button>
            )}
          </div>
          <div>
            <dt>{t("summary.ai")}</dt>
            <dd>
              {!plan ? (
                "—"
              ) : plan.aiIncluded ? (
                t("summary.aiIncluded")
              ) : addon ? (
                <>
                  <span>{i18n.t(`landing.addons.items.${addon.id}.name`)}</span>
                  <span>{formatMoney(addon.value)}</span>
                </>
              ) : (
                t("summary.aiNone")
              )}
            </dd>
          </div>
          <div>
            <dt>{t("summary.mode")}</dt>
            <dd>{mode ? t(`modeNames.${mode}`) : mt("summaryPending")}</dd>
            {mode && (
              <button
                type="button"
                onClick={() => onEdit(1)}
                aria-label={mt("summaryLayout.changeMode")}
              >
                {t("summary.change")}
              </button>
            )}
          </div>
        </dl>
        {plan?.tier === "enterprise" && (
          <ul
            className="co-order-extras"
            aria-label={i18n.t("landing.plans.enterprise.exclusiveTitle")}
          >
            {i18n
              .t("landing.plans.enterprise.exclusive", { returnObjects: true })
              .map(item => (
                <li key={item.id}>
                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                  {item.title}
                </li>
              ))}
          </ul>
        )}
        <div className="co-order-today">
          <span>{mt("summaryLayout.today")}</span>
          <strong>{formatMoney(0, plan?.currency)}</strong>
        </div>
        <div className="co-order-price">
          <span>{t("summary.total")}</span>
          <div>
            <strong>{plan ? formatMoney(total, plan.currency) : "—"}</strong>
            {plan && <span>{mt("perMonth")}</span>}
          </div>
        </div>
        <dl className="co-order-schedule">
          <div>
            <dt>{mt("summaryLayout.dueDay")}</dt>
            <dd>{mt("dueDayOption", { day: dueDay })}</dd>
            {plan && mode && (
              <button
                type="button"
                onClick={() => onEdit(2)}
                aria-label={mt("summaryLayout.changeDueDay")}
              >
                {t("summary.change")}
              </button>
            )}
          </div>
          <div>
            <dt>{mt("summaryLayout.firstCharge")}</dt>
            <dd>{civilDate(trialEnd)}</dd>
          </div>
          {plan && (
            <div className="co-order-first-charge">
              <dt>
                {mt("summaryLayout.firstChargeValue", {
                  count: firstChargeDays
                })}
              </dt>
              <dd>{formatMoney(firstCharge / 100, plan.currency)}</dd>
            </div>
          )}
          <div>
            <dt>{mt("summaryLayout.firstDue")}</dt>
            <dd>{civilDate(firstDue)}</dd>
          </div>
        </dl>
        <p className="co-order-consent">{mt("summaryLayout.consent")}</p>
        {mode === "official" && (
          <p className="co-order-meta">{t("summary.metaCost")}</p>
        )}
      </aside>
    </div>
  );
}
