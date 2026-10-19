import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AccountTreeOutlined,
  ArrowForwardRounded,
  AssessmentOutlined,
  BlurOnRounded,
  CheckCircleRounded,
  EventOutlined,
  ForumOutlined,
  GroupOutlined,
  LabelOutlined,
  QuestionAnswerOutlined,
  ScheduleOutlined,
  SendRounded,
  AndroidOutlined,
  SwapHorizRounded,
  VerifiedUserOutlined,
  ViewQuiltOutlined,
  WhatsApp,
  CropFreeRounded,
  ContactsOutlined
} from "@material-ui/icons";
import {
  Headset,
  Lock,
  Megaphone,
  Puzzle,
  Rocket,
  Sparkles
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import {
  AI_ADDONS,
  assetUrl,
  formatMoney,
  getEnterpriseUpgrade,
  pricePerUser,
  usePublicPlans
} from "./plans";

const t = (key, options) => i18n.t(`landing.${key}`, options);
const list = key => i18n.t(`landing.${key}`, { returnObjects: true });

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Scroll progress (0..1) of a tall section while its sticky child is pinned.
   The landing scrolls inside #root, not the window. */
const useScrollProgress = (ref, enabled = true) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.getElementById("root");
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const node = ref.current;
        if (!node || !root) return;
        const rect = node.getBoundingClientRect();
        const rootTop = root.getBoundingClientRect().top;
        const distance = node.offsetHeight - root.clientHeight;
        const value = (rootTop - rect.top) / Math.max(1, distance);
        setProgress(Math.max(0, Math.min(1, value)));
      });
    };
    update();
    root?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      root?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, enabled]);
  return progress;
};

const useMedia = query => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setMatches(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [query]);
  return matches;
};

/* ------------------------------------------------------------------ */
/* Pieces: a 3D keyboard of product features that lights up in waves. */
/* ------------------------------------------------------------------ */

const PIECE_ICONS = {
  inbox: ForumOutlined,
  queues: AccountTreeOutlined,
  ai: Sparkles,
  tags: LabelOutlined,
  campaigns: Megaphone,
  chatbot: AndroidOutlined,
  reports: AssessmentOutlined,
  schedule: EventOutlined,
  contacts: ContactsOutlined,
  transfer: SwapHorizRounded,
  quick: QuestionAnswerOutlined,
  qrcode: CropFreeRounded,
  official: VerifiedUserOutlined,
  team: GroupOutlined,
  kanban: ViewQuiltOutlined,
  hours: ScheduleOutlined
};
const PIECE_KEYS = Object.keys(PIECE_ICONS);
const COLUMNS = 12;
const ROWS = 5;
const TONES = ["primary", "green", "orange", "accent"];

// Deterministic layout: labelled keys spread across the board, blanks between.
const BOARD = Array.from({ length: COLUMNS * ROWS }, (_, index) => {
  const labelled = index % 5 !== 2;
  const key = labelled ? PIECE_KEYS[(index * 5) % PIECE_KEYS.length] : null;
  return { index, key };
});

export const Pieces = ({ reduced = false }) => {
  const [lit, setLit] = useState({
    0: "primary",
    3: "accent",
    5: "orange",
    8: "primary",
    13: "accent",
    17: "primary",
    20: "orange",
    24: "primary",
    28: "accent",
    33: "orange",
    38: "primary",
    42: "accent",
    47: "primary",
    51: "orange",
    55: "accent"
  });
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const boardRef = useRef(null);
  const areaRef = useRef(null);
  const progress = useScrollProgress(areaRef);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: document.getElementById("root") }
    );
    observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || prefersReducedMotion() || !visible) return undefined;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      // A diagonal wave travels across the board, colouring a few keys.
      const next = {};
      BOARD.forEach(({ index }) => {
        const column = index % COLUMNS;
        const row = Math.floor(index / COLUMNS);
        const wave = (column + row * 2 + step) % 7;
        if ((wave === 0 || wave === 1) && (index * 7 + step) % 4 !== 0) {
          next[index] = TONES[(index + step) % TONES.length];
        }
      });
      setLit(next);
    }, 1100);
    return () => clearInterval(timer);
  }, [reduced, visible]);

  const select = cell => {
    if (!cell.key) return;
    setSelected(cell);
  };

  const piece = selected ? list(`pieces.items.${selected.key}`) : null;
  const tilt = reduced ? 20 : 24 - progress * 7;

  return (
    <section
      className="lpx-pieces"
      ref={areaRef}
      aria-labelledby="lpx-pieces-title"
    >
      <div className="lp-wrap lpx-pieces-head">
        <span className="lp-kicker" id="lpx-pieces-title">
          {t("motion.pieces")}
        </span>
        <span className="lp-kicker">{t("motion.piecesHint")} +</span>
      </div>
      <div className="lpx-board-scene">
        <div className="lpx-board-viewport">
          <div
            className="lpx-board"
            ref={boardRef}
            style={{ "--lpx-tilt": `${tilt}deg` }}
          >
            {BOARD.map(cell => {
              const Icon = cell.key ? PIECE_ICONS[cell.key] : null;
              const tone = lit[cell.index];
              const isSelected = selected?.index === cell.index;
              return cell.key ? (
                <button
                  type="button"
                  key={cell.index}
                  className={`lpx-key ${tone ? `is-lit is-${tone}` : ""} ${
                    isSelected ? "is-selected" : ""
                  }`}
                  onClick={() => select(cell)}
                  aria-pressed={isSelected}
                  aria-label={list(`pieces.items.${cell.key}`).title}
                >
                  <span className="lpx-key-top">
                    <Icon />
                    <small>{list(`pieces.items.${cell.key}`).title}</small>
                  </span>
                </button>
              ) : (
                <span
                  key={cell.index}
                  className={`lpx-key lpx-key--blank ${tone ? `is-lit is-${tone}` : ""}`}
                  aria-hidden="true"
                >
                  <span className="lpx-key-top" />
                </span>
              );
            })}
          </div>
        </div>
        <div className="lpx-caption" aria-live="polite">
          {piece ? (
            <div key={selected.index} className="lpx-caption-card">
              <strong>{piece.title}</strong>
              <p>{piece.description}</p>
            </div>
          ) : (
            <div className="lpx-caption-card lpx-caption-card--hint">
              <BlurOnRounded />
              <a href="#agente">
                {t("motion.prompt")} <ArrowForwardRounded />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Ask the agent: a prompt types itself and the work gets done.       */
/* ------------------------------------------------------------------ */

export const AskAgent = ({ reduced = false }) => {
  const prompts = list("ask.prompts");
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [done, setDone] = useState(0);
  const [visible, setVisible] = useState(false);
  const areaRef = useRef(null);
  const reduce = reduced || prefersReducedMotion();
  const prompt = prompts[active];

  useEffect(() => {
    const node = areaRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: document.getElementById("root"), threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTyped(reduce ? prompt.text.length : 0);
    setDone(reduce ? prompt.results.length : 0);
    setPhase(reduce ? "done" : "typing");
  }, [active, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || reduce) return undefined;
    let timer;
    if (phase === "typing") {
      if (typed < prompt.text.length) {
        timer = setTimeout(() => setTyped(value => value + 1), 28);
      } else {
        timer = setTimeout(() => setPhase("sending"), 450);
      }
    } else if (phase === "sending") {
      timer = setTimeout(() => setPhase("working"), 650);
    } else if (phase === "working") {
      if (done < prompt.results.length) {
        timer = setTimeout(() => setDone(value => value + 1), 700);
      } else {
        timer = setTimeout(() => setPhase("done"), 400);
      }
    } else if (phase === "done") {
      timer = setTimeout(
        () => setActive(value => (value + 1) % prompts.length),
        4200
      );
    }
    return () => clearTimeout(timer);
  }, [visible, phase, typed, done, prompt, prompts.length, reduce]);

  return (
    <section className="lpx-ask lp-wrap" ref={areaRef} id="agente">
      <div className="lpx-ask-head">
        <span className="lp-kicker">
          <i />
          {t("ask.eyebrow")}
        </span>
        <h2>
          {t("ask.title")}
          <em>{t("ask.highlight")}</em>
        </h2>
        <p>{t("ask.description")}</p>
      </div>
      <div className={`lpx-ask-card is-${phase}`}>
        <div className="lpx-ask-top">
          <span className="lpx-ask-orb">
            <Sparkles />
          </span>
          <span>
            <small>{t("ask.cardLabel")}</small>
            <strong>{t("ask.cardTitle")}</strong>
          </span>
        </div>
        <div className="lpx-ask-input">
          <p>
            {prompt.text.slice(0, typed)}
            {phase === "typing" && <span className="lpx-caret" />}
          </p>
          <span className="lpx-ask-send">
            <SendRounded />
          </span>
        </div>
        <ul className="lpx-ask-results">
          {prompt.results.map((result, index) => (
            <li
              key={`${active}-${result}`}
              className={index < done ? "is-done" : ""}
            >
              {index < done ? (
                <CheckCircleRounded />
              ) : (
                <span className="lpx-spinner" />
              )}
              {result}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="lpx-ask-chips"
        role="tablist"
        aria-label={t("ask.eyebrow")}
      >
        {prompts.map((item, index) => (
          <button
            type="button"
            role="tab"
            key={item.chip}
            aria-selected={index === active}
            className={index === active ? "is-active" : ""}
            onClick={() => setActive(index)}
          >
            {item.chip}
          </button>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Official vs QR code: a pinned stage that tells the story on scroll. */
/* ------------------------------------------------------------------ */

const MODE_STAGES = ["official", "unofficial", "same"];

export const ModesTrack = ({ reduced = false }) => {
  const areaRef = useRef(null);
  const compact = useMedia("(max-width: 960px)");
  const supportsPin = useMedia(
    "(min-width: 961px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)"
  );
  const pinned = supportsPin && !reduced;
  const progress = useScrollProgress(areaRef, pinned);
  const [manual, setManual] = useState(0);
  const [touched, setTouched] = useState(false);
  const stage = pinned ? Math.min(2, Math.floor(progress * 3)) : manual;

  // Without the pinned scroll stage, the story advances on its own until
  // the visitor picks a step.
  useEffect(() => {
    if (compact || pinned || touched || reduced || prefersReducedMotion())
      return undefined;
    const timer = setInterval(() => setManual(value => (value + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, [compact, pinned, touched, reduced]);
  const current = MODE_STAGES[stage];

  const jump = index => {
    if (!pinned) {
      setTouched(true);
      setManual(index);
      return;
    }
    const root = document.getElementById("root");
    const area = areaRef.current;
    const top =
      area.getBoundingClientRect().top -
      root.getBoundingClientRect().top +
      root.scrollTop;
    root.scrollTo({
      top: top + (area.offsetHeight - root.clientHeight) * ((index + 0.2) / 3),
      behavior: "smooth"
    });
  };

  const controls = (
    <div
      className="lpx-modes-controls"
      role="group"
      aria-label={t("modes.title")}
    >
      <span className="lpx-modes-bar" aria-hidden="true">
        <i
          style={{
            transform: `scaleX(${pinned ? progress : (stage + 1) / 3})`
          }}
        />
      </span>
      {MODE_STAGES.map((key, index) => (
        <button
          type="button"
          key={key}
          onClick={() => jump(index)}
          aria-pressed={index === stage}
        >
          <span aria-hidden="true">0{index + 1}</span>
          {t(`modes.${key}.tag`)}
        </button>
      ))}
    </div>
  );

  return (
    <section
      className={`lpx-modes ${pinned ? "is-pinned" : ""}`}
      id="conexao"
      ref={areaRef}
      style={{ "--lpx-progress": progress }}
    >
      <div className="lpx-modes-sticky lp-wrap">
        <div className="lp-section-heading">
          <div>
            <span className="lp-kicker">
              <i />
              {t("modes.eyebrow")}
            </span>
            <h2>{t("modes.title")}</h2>
          </div>
          <p>{t("modes.description")}</p>
        </div>
        {compact && controls}
        <div className={`lpx-modes-stage is-${current}`}>
          <div className="lpx-modes-art" aria-hidden="true">
            <img
              className="lpx-art lpx-art--official"
              src={assetUrl("/branding/checkout/oficial.webp")}
              alt=""
              width="320"
              height="320"
            />
            <img
              className="lpx-art lpx-art--unofficial"
              src={assetUrl("/branding/checkout/qrcode.webp")}
              alt=""
              width="320"
              height="320"
            />
            <span className="lpx-art-link">
              <WhatsApp />
            </span>
          </div>
          <div className="lpx-modes-copy">
            {MODE_STAGES.map((key, index) => (
              <article
                key={key}
                className={`lpx-mode-panel lpx-mode-panel--${key} ${
                  index === stage ? "is-active" : ""
                }`}
                aria-hidden={index !== stage}
                hidden={compact && index !== stage}
              >
                <span className="lpx-mode-tag">{t(`modes.${key}.tag`)}</span>
                <h3>{t(`modes.${key}.title`)}</h3>
                <p>{t(`modes.${key}.description`)}</p>
                <ul>
                  {list(`modes.${key}.points`).map(point => (
                    <li key={point}>
                      <CheckCircleRounded />
                      {point}
                    </li>
                  ))}
                </ul>
                {t(`modes.${key}.note`) && (
                  <p className="lpx-mode-note">{t(`modes.${key}.note`)}</p>
                )}
              </article>
            ))}
          </div>
        </div>
        {!compact && controls}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

const planName = plan =>
  plan.tier && plan.tier !== "custom"
    ? t(`plans.tiers.${plan.tier}.name`)
    : plan.name;

const EXCLUSIVE_ICONS = {
  custom: Puzzle,
  priority: Headset,
  onboarding: Rocket
};
const SERVICE_ROWS = ["custom", "priority", "onboarding"];
// Plans only differ in limits; every one of them ships these features.
const SHARED_ROWS = [
  "modes",
  "attendance",
  "flows",
  "campaigns",
  "tasks",
  "internalChat"
];

const planPhase = plan => t(`plans.phases.${plan.tier || "custom"}`);

// Cost per user is the honest anchor: Enterprise costs the same or less per
// person, so smaller plans say so and Enterprise shows its own figure.
const enterpriseNudge = (plan, enterprise) => {
  const own = pricePerUser(plan);
  const best = pricePerUser(enterprise);
  if (own === null || best === null || best - own > 0.005) return null;
  return own - best > 0.005
    ? t("plans.nudge.cheaper", {
        price: formatMoney(best, enterprise.currency)
      })
    : t("plans.nudge.same");
};

// Cards rise in sequence once, when the grid first scrolls into view.
const gridMotion = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12 } }
};
const cardMotion = {
  hidden: { opacity: 0, y: 28 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const PlanCard = ({ plan, enterprise, below, contactUrl }) => {
  const tier = plan.tier !== "custom" ? plan.tier : null;
  const featured = tier === "enterprise";
  const headingId = `lpx-plan-${plan.id}`;
  const upgrade = featured ? getEnterpriseUpgrade(below, plan) : null;
  const extras = Object.fromEntries(
    (upgrade?.capacities || []).map(({ key, extra }) => [key, extra])
  );
  const unitPrice = featured ? pricePerUser(plan) : null;
  const nudge = !featured && enterprise && enterpriseNudge(plan, enterprise);
  const limit = (key, label) => (
    <li>
      <CheckCircleRounded />
      <span>{label}</span>
      {extras[key] && (
        <small className="lpx-plan-plus">
          {t("plans.enterprise.plusCapacity", {
            count: extras[key],
            name: planName(below)
          })}
        </small>
      )}
    </li>
  );
  return (
    <motion.article
      variants={cardMotion}
      className={`lpx-plan ${featured ? "lpx-plan--featured" : ""}`}
      aria-labelledby={headingId}
    >
      {featured && (
        <p className="lpx-plan-flag">{t("plans.enterprise.badge")}</p>
      )}
      <div className="lpx-plan-body">
        <p className="lpx-plan-phase">{planPhase(plan)}</p>
        <h3 id={headingId}>{planName(plan)}</h3>
        <p className="lpx-plan-pitch">
          {tier ? t(`plans.tiers.${tier}.pitch`) : t("plans.customPitch")}
        </p>
        <p className="lpx-plan-price">
          <strong>{formatMoney(plan.value, plan.currency)}</strong>
          <span>{t("plans.perMonth")}</span>
        </p>
        {unitPrice !== null && (
          <p className="lpx-plan-unit">
            {t("plans.enterprise.perUser", {
              price: formatMoney(unitPrice, plan.currency)
            })}
          </p>
        )}
        <p className={`lpx-plan-ai ${plan.aiIncluded ? "is-included" : ""}`}>
          <Sparkles />
          {plan.aiIncluded ? t("plans.aiUnlimited") : t("plans.aiSeparate")}
        </p>
        <ul className="lpx-plan-limits">
          {limit("users", t("plans.users", { count: plan.users }))}
          {limit(
            "connections",
            t("plans.connections", { count: plan.connections })
          )}
          {limit("queues", t("plans.queues", { count: plan.queues }))}
          <li>
            <CheckCircleRounded />
            <span>{t("plans.bothModes")}</span>
          </li>
        </ul>
        {featured && (
          <div className="lpx-plan-exclusive">
            <h4>
              {upgrade
                ? t("plans.enterprise.upgradeTitle", {
                    price: formatMoney(upgrade.delta, plan.currency),
                    name: planName(below)
                  })
                : t("plans.enterprise.exclusiveTitle")}
            </h4>
            <ul>
              {list("plans.enterprise.exclusive").map(item => {
                const Icon = EXCLUSIVE_ICONS[item.id] || Puzzle;
                return (
                  <li key={item.id}>
                    <Icon aria-hidden="true" />
                    <span>
                      <strong>{item.title}</strong>
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!featured && enterprise && (
          <div className="lpx-plan-exclusive lpx-plan-exclusive--locked">
            <h4>{t("plans.enterprise.lockedTitle")}</h4>
            <ul>
              {list("plans.enterprise.exclusive").map(item => (
                <li key={item.id}>
                  <Lock aria-hidden="true" />
                  <span>
                    <strong>
                      <span className="lpx-sr-only">
                        {t("plans.enterprise.notIncluded")}{" "}
                      </span>
                      {item.title}
                    </strong>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {nudge && <p className="lpx-plan-nudge">{nudge}</p>}
        <div className="lpx-plan-actions">
          <a
            className={`lp-button ${featured ? "" : "lp-button--outline"}`}
            href={`/assinar?plano=${plan.id}`}
          >
            {t("plans.choose", { name: planName(plan) })}
            <ArrowForwardRounded />
          </a>
          {featured && contactUrl && (
            <a
              className="lpx-plan-talk"
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsApp />
              {t("plans.enterprise.talk")}
            </a>
          )}
          {featured && (
            <p className="lpx-plan-trial">{t("plans.enterprise.trialNote")}</p>
          )}
        </div>
      </div>
    </motion.article>
  );
};

const Mark = ({ included }) => (
  <td
    className={included ? "is-included" : "is-missing"}
    aria-label={t(
      included ? "plans.compare.included" : "plans.compare.notIncluded"
    )}
  >
    {included ? (
      <CheckCircleRounded aria-hidden="true" />
    ) : (
      <span aria-hidden="true">—</span>
    )}
  </td>
);

const PlanComparison = ({ plans }) => {
  const cheapestAddon = Math.min(...AI_ADDONS.map(addon => addon.value));
  const groups = [
    {
      key: "capacity",
      rows: ["users", "connections", "queues"].map(key => ({
        key,
        cells: plans.map(plan => <td key={plan.id}>{plan[key]}</td>)
      }))
    },
    {
      key: "ai",
      rows: [
        {
          key: "ai",
          cells: plans.map(plan => (
            <td key={plan.id}>
              {plan.aiIncluded
                ? t("plans.compare.aiUnlimited")
                : t("plans.compare.aiFrom", {
                    price: formatMoney(cheapestAddon)
                  })}
            </td>
          ))
        }
      ]
    },
    {
      key: "shared",
      rows: SHARED_ROWS.map(key => ({
        key,
        cells: plans.map(plan => <Mark key={plan.id} included />)
      }))
    },
    {
      key: "service",
      rows: SERVICE_ROWS.map(key => ({
        key,
        cells: plans.map(plan => (
          <Mark key={plan.id} included={plan.tier === "enterprise"} />
        ))
      }))
    }
  ];
  return (
    <div className="lpx-compare" data-lp-motion>
      <div className="lpx-compare-scroll">
        <table aria-labelledby="lpx-compare-title">
          <caption id="lpx-compare-title">{t("plans.compare.title")}</caption>
          <colgroup>
            <col />
            {plans.map(plan => (
              <col
                key={plan.id}
                className={plan.tier === "enterprise" ? "is-featured" : ""}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className="lpx-sr-only">{t("plans.compare.plan")}</span>
              </th>
              {plans.map(plan => (
                <th
                  scope="col"
                  key={plan.id}
                  className={plan.tier === "enterprise" ? "is-featured" : ""}
                >
                  <span>{planPhase(plan)}</span>
                  {planName(plan)}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map(group => (
            <tbody
              key={group.key}
              className={`lpx-compare-group--${group.key}`}
            >
              <tr className="lpx-compare-group">
                <th scope="rowgroup" colSpan={plans.length + 1}>
                  {t(`plans.compare.groups.${group.key}`)}
                </th>
              </tr>
              {group.rows.map(row => (
                <tr key={row.key}>
                  <th scope="row">{t(`plans.compare.rows.${row.key}`)}</th>
                  {row.cells}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
};

export const Plans = ({ whatsappNumber }) => {
  const { plans, status } = usePublicPlans();
  const reduceMotion = useReducedMotion();
  const enterprise = plans.find(plan => plan.tier === "enterprise");
  // The plan right below Enterprise is the one its price is compared to.
  const below = enterprise
    ? plans
        .filter(
          plan =>
            plan.id !== enterprise.id &&
            Number(plan.value) < Number(enterprise.value)
        )
        .pop()
    : null;
  const contactUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        t("plans.enterprise.whatsappMessage")
      )}`
    : null;
  return (
    <section className="lpx-plans lp-wrap" id="planos">
      <div className="lpx-plans-head" data-lp-motion>
        <h2>{t("plans.title")}</h2>
        <p>{t("plans.description")}</p>
        <p className="lpx-trial-note">
          <VerifiedUserOutlined aria-hidden="true" />
          {t("plans.trialPromise")}
        </p>
      </div>
      {status === "loading" && (
        <div className="lpx-plan-grid" aria-busy="true">
          {[0, 1, 2].map(index => (
            <div className="lpx-plan lpx-plan--skeleton" key={index} />
          ))}
        </div>
      )}
      {status === "ready" && (
        <>
          <motion.div
            className="lpx-plan-grid"
            variants={reduceMotion ? undefined : gridMotion}
            initial={reduceMotion ? false : "hidden"}
            whileInView="shown"
            viewport={{ once: true, amount: 0.2 }}
          >
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                enterprise={enterprise}
                below={below}
                contactUrl={contactUrl}
              />
            ))}
          </motion.div>
          <PlanComparison plans={plans} />
        </>
      )}
      {(status === "error" || status === "empty") && (
        <p className="lpx-plans-empty">{t("plans.unavailable")}</p>
      )}
      <div className="lpx-addons" data-lp-motion>
        <div className="lpx-addons-intro">
          <span className="lpx-addons-icon">
            <Sparkles />
          </span>
          <h3>{t("addons.title")}</h3>
          <p>{t("addons.description")}</p>
        </div>
        <ul className="lpx-addons-list">
          {AI_ADDONS.map(addon => (
            <li key={addon.id}>
              <strong>{t(`addons.items.${addon.id}.name`)}</strong>
              <span className="lpx-addons-price">
                + {formatMoney(addon.value)}
                <small>{t("plans.perMonth")}</small>
              </span>
              <p>{t(`addons.items.${addon.id}.includes`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
