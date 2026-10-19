import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  GitBranch,
  Layers,
  Maximize,
  MessageCircle,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Users
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import { cameraAt, ease, useSceneProgress } from "./SceneMotion";
import SceneDrawer from "./SceneDrawer";

const t = (key, options) => i18n.t(`landing.motion.${key}`, options);
const items = key => t(key, { returnObjects: true });
const clamp = value => Math.max(0, Math.min(1, value));
const reveal = (progress, start, duration = 0.16) => {
  const amount = ease((progress - start) / duration);
  return {
    opacity: amount,
    transform: `translate3d(0, ${(1 - amount) * 65}px, ${(1 - amount) * 90}px)`,
    visibility: amount === 0 ? "hidden" : "visible"
  };
};
const TRACKS = ["journey", "crm", "automation", "campaign"];
const IDS = {
  journey: "como-funciona",
  crm: "experiencia-crm",
  automation: "experiencia-automacao",
  campaign: "experiencia-campanhas"
};
const ICONS = {
  journey: MessageCircle,
  crm: Users,
  automation: GitBranch,
  campaign: Send
};

export function ExperienceNav() {
  return (
    <nav className="lp-experience-nav" aria-label={t("navigation")}>
      {TRACKS.map(kind => {
        const Icon = ICONS[kind];
        return (
          <a key={kind} href={`#${IDS[kind]}`}>
            <Icon size={14} />
            {t(`${kind}.nav`)}
          </a>
        );
      })}
      <a href="#agente">
        <Sparkles size={14} />
        {i18n.t("landing.ask.eyebrow")}
      </a>
      <a href="#conexao">
        <Layers size={14} />
        {i18n.t("landing.nav.connection")}
      </a>
      <a href="#planos">
        <ArrowUpRight size={14} />
        {i18n.t("landing.nav.plans")}
      </a>
    </nav>
  );
}

function useTrack(ref, reduced) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pinned, setPinned] = useState(false);
  const visible = useRef(false);
  const value = useRef(0);
  const manual = useRef(false);
  const update = next => {
    value.current = clamp(next);
    setProgress(value.current);
  };
  useEffect(() => {
    const root = document.getElementById("root");
    const media = window.matchMedia(
      "(min-width: 901px) and (min-height: 720px), (max-width: 900px) and (min-height: 800px)"
    );
    let frame;
    // Use the same geometry for scroll and seeking. Short/landscape screens
    // follow the story as it passes through the viewport, without pinning it.
    const geometry = () => {
      const node = ref.current;
      if (!node || !root) return null;
      const offset = root.clientWidth <= 600 ? 110 : 116;
      const top =
        node.getBoundingClientRect().top - root.getBoundingClientRect().top;
      const pinned = media.matches && !reduced;
      return {
        top,
        anchor: pinned ? offset : root.clientHeight * 0.7,
        distance: Math.max(
          1,
          pinned
            ? node.offsetHeight - root.clientHeight + offset
            : node.offsetHeight + root.clientHeight * 0.2
        )
      };
    };
    const sync = () => {
      if (!visible.current || reduced || manual.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const track = geometry();
        if (track) update((track.anchor - track.top) / track.distance);
      });
    };
    const scroll = () => {
      if (visible.current && !manual.current) {
        setPlaying(false);
        sync();
      }
    };
    const resumeScroll = event => {
      if (
        event.type === "keydown" &&
        ![
          "PageDown",
          "PageUp",
          "ArrowDown",
          "ArrowUp",
          "Home",
          "End",
          " "
        ].includes(event.key)
      )
        return;
      if (event.target.closest("input, dialog")) return;
      if (event.type === "keydown" && event.target.closest("button, a")) return;
      manual.current = false;
    };
    const resize = () => {
      setPinned(media.matches && !reduced);
      sync();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        if (entry.isIntersecting) sync();
        else {
          setPlaying(false);
          manual.current = false;
        }
      },
      { root }
    );
    observer.observe(ref.current);
    resize();
    root?.addEventListener("scroll", scroll, { passive: true });
    root?.addEventListener("wheel", resumeScroll, { passive: true });
    root?.addEventListener("touchmove", resumeScroll, { passive: true });
    root?.addEventListener("keydown", resumeScroll);
    window.addEventListener("resize", resize);
    media.addEventListener("change", resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root?.removeEventListener("scroll", scroll);
      root?.removeEventListener("wheel", resumeScroll);
      root?.removeEventListener("touchmove", resumeScroll);
      root?.removeEventListener("keydown", resumeScroll);
      window.removeEventListener("resize", resize);
      media.removeEventListener("change", resize);
    };
  }, [ref, reduced]);
  useEffect(() => {
    if (!playing || reduced) return undefined;
    let frame;
    let previous;
    const tick = now => {
      if (previous)
        update(value.current + Math.min(now - previous, 50) / 18000);
      previous = now;
      if (value.current >= 1) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, reduced]);
  const seek = next => {
    manual.current = true;
    setPlaying(false);
    update(next);
    if (pinned) {
      const root = document.getElementById("root");
      const node = ref.current;
      if (!root || !node) return;
      const offset = root.clientWidth <= 600 ? 110 : 116;
      const start =
        node.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        offset;
      root.scrollTo({
        top:
          start +
          clamp(next) * (node.offsetHeight - root.clientHeight + offset),
        behavior: "instant"
      });
    }
  };
  const toggle = () => {
    manual.current = true;
    if (value.current >= 1) update(0);
    setPlaying(current => !current);
  };
  return { progress, playing, pinned, seek, toggle };
}

const Avatar = () => <span className="lp-scene-avatar">{t("avatar")}</span>;
const NodeHead = ({ icon: Icon, children }) => (
  <div className="lp-node-head">
    <Icon size={17} />
    <strong>{children}</strong>
    <span>•••</span>
  </div>
);

function FlowScene({ kind, progress, inspect, reduced }) {
  const automation = kind === "automation";
  const titles = automation
    ? [t("received"), t("condition"), t("sales"), t("support"), t("assigned")]
    : [
        t("received"),
        i18n.t("landing.mock.inbox"),
        t("sales"),
        t("team"),
        t("followup")
      ];
  const icons = [
    MessageCircle,
    automation ? GitBranch : Layers,
    Users,
    automation ? Users : MessageCircle,
    CheckCheck
  ];
  const positions = automation
    ? [
        [40, 140],
        [290, 140],
        [550, 45],
        [550, 245],
        [815, 140]
      ]
    : [
        [25, 155],
        [265, 155],
        [505, 40],
        [505, 260],
        [765, 155]
      ];
  const starts = automation
    ? [-0.14, 0.16, 0.38, 0.44, 0.72]
    : [-0.14, 0.13, 0.31, 0.5, 0.74];
  const paths = automation
    ? [
        "M240 215 C260 215 270 215 290 215",
        "M490 215 C540 215 500 120 550 120",
        "M490 215 C540 215 500 320 550 320",
        "M750 120 C800 120 765 215 815 215",
        "M750 320 C800 320 765 215 815 215"
      ]
    : [
        "M225 230 C240 230 250 230 265 230",
        "M465 230 C515 230 455 115 505 115",
        "M605 190 C605 215 605 235 605 260",
        "M705 335 C765 335 705 230 765 230"
      ];
  return (
    <div className={`lp-flow-scene is-${kind}`}>
      <svg className="lp-flow-lines" viewBox="0 0 1040 460" aria-hidden="true">
        {paths.map((path, index) => {
          const start = (
            automation
              ? [0.07, 0.27, 0.33, 0.63, 0.68]
              : [0.06, 0.23, 0.43, 0.65]
          )[index];
          const amount = ease((progress - start) / 0.16);
          return (
            <g key={path} opacity={amount > 0 ? 1 : 0}>
              <path d={path} className="lp-flow-guide" opacity={amount} />
              <path
                d={path}
                pathLength="1"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 1 - amount
                }}
              />
              {!reduced && (
                <circle
                  r="3.2"
                  className="lp-flow-particle"
                  opacity={amount >= 0.99 ? 1 : 0}
                >
                  <animateMotion
                    dur="5s"
                    begin={`${-index}s`}
                    repeatCount="indefinite"
                    path={path}
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
      {positions.map(([x, y], index) => {
        const Icon = icons[index];
        return (
          <button
            type="button"
            key={index}
            className={`lp-flow-node lp-flow-node--${index}`}
            style={{ left: x, top: y, ...reveal(progress, starts[index]) }}
            onClick={() => inspect(titles[index], index)}
            tabIndex={progress <= starts[index] ? -1 : 0}
            aria-label={t("view", { name: titles[index] })}
          >
            <NodeHead icon={Icon}>{titles[index]}</NodeHead>
            {index === 0 ? (
              <>
                <div className="lp-node-person">
                  <Avatar />
                  <b>{t("contact")}</b>
                </div>
                <p>{t("incoming")}</p>
              </>
            ) : index === 1 ? (
              automation ? (
                <div className="lp-node-options">
                  {items("branches").map((label, i) => (
                    <span key={label}>
                      {i + 1}
                      <b>{label}</b>
                      <ChevronRight size={13} />
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <p>{t("typing")}</p>
                  <div className="lp-node-person">
                    <Avatar />
                    <span>
                      {t("contact")}
                      <small>{t("received")}</small>
                    </span>
                    <i className="lp-node-count">1</i>
                  </div>
                </>
              )
            ) : index === 2 || (automation && index === 3) ? (
              <>
                <div className="lp-team-avatars">
                  <span>AS</span>
                  <span>BL</span>
                  <span>+2</span>
                </div>
                <span className="lp-scene-tag">
                  <Check size={12} />
                  {t("assigned")}
                </span>
              </>
            ) : index === 3 ? (
              <>
                <p className="lp-node-reply">{t("reply")}</p>
                <CheckCheck size={16} />
              </>
            ) : (
              <>
                <span className="lp-scene-tag">
                  <Check size={12} />
                  {t("preserved")}
                </span>
                <p>{t("saved")}</p>
                <span className="lp-node-check">
                  <Check size={18} />
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CrmScene({ progress, inspect }) {
  const move =
    2 * clamp((progress - 0.4) / 0.2) + clamp((progress - 0.76) / 0.13);
  const left = 30 + move * 255;
  return (
    <div className="lp-crm-scene">
      {items("labels").map((label, index) => (
        <button
          type="button"
          className="lp-crm-column"
          key={label}
          onClick={() => inspect(label, 0)}
          aria-label={t("view", { name: label })}
          style={{
            left: 20 + index * 255,
            ...reveal(progress, -0.16 + index * 0.035, 0.15)
          }}
        >
          <div className="lp-node-head">
            <i />
            <strong>{label}</strong>
            <span>{index === Math.round(move) ? "1" : "0"}</span>
          </div>
          <span className="lp-crm-placeholder">
            <Plus size={15} />
          </span>
        </button>
      ))}
      <button
        className="lp-crm-contact"
        type="button"
        style={{
          left,
          ...reveal(progress, 0.15),
          transform: `translateY(${45 - Math.sin((move % 1) * Math.PI) * 65}px) translateZ(35px)`
        }}
        onClick={() => inspect(t("contact"), 0)}
        aria-label={t("view", { name: t("contact") })}
      >
        <div className="lp-node-person">
          <Avatar />
          <span>
            <b>{t("contact")}</b>
            <small>{t("tags.0")}</small>
          </span>
          <span>•••</span>
        </div>
        <p>{t("incoming")}</p>
        <span className="lp-scene-tag">{t("tags.1")}</span>
        <footer>
          <span>AS</span>
          {t("team")}
          <MessageCircle size={13} />
        </footer>
      </button>
      <div className="lp-crm-context" style={reveal(progress, 0.77)}>
        <CheckCheck size={19} />
        <span>
          <b>{t("preserved")}</b>
          <small>{t("tags.2")}</small>
        </span>
      </div>
    </div>
  );
}

function CampaignScene({ progress, inspect }) {
  return (
    <div className="lp-campaign-scene">
      <button
        type="button"
        className="lp-audience-card"
        style={reveal(progress, -0.15)}
        onClick={() => inspect(t("audience"), 0)}
      >
        <NodeHead icon={Users}>{t("campaign.steps.0.label")}</NodeHead>
        <strong className="lp-audience-number">{t("audienceValue")}</strong>
        <p>{t("audience")}</p>
        <div className="lp-team-avatars">
          <span>MC</span>
          <span>RL</span>
          <span>BC</span>
          <span>+125</span>
        </div>
      </button>
      <div className="lp-campaign-arrow" style={reveal(progress, 0.1)}>
        <ArrowRight />
      </div>
      <button
        type="button"
        className="lp-phone-card"
        style={reveal(progress, 0.16)}
        onClick={() => inspect(t("campaign.steps.1.title"), 1)}
      >
        <header>
          <Avatar />
          <span>
            <b>Espaço Whats</b>
            <small>{t("campaign.nav")}</small>
          </span>
          <MessageCircle size={17} />
        </header>
        <div className="lp-phone-chat">
          <p>
            {t("campaignMessage").slice(
              0,
              Math.ceil(
                t("campaignMessage").length * clamp((progress - 0.18) / 0.22)
              )
            )}
            <CheckCheck size={15} />
          </p>
          <span className="lp-phone-date" style={reveal(progress, 0.45)}>
            <Clock size={14} />
            {t("campaignTime")}
          </span>
        </div>
        <footer>
          <span>{t("campaign.steps.1.label")}</span>
          <Send size={17} />
        </footer>
      </button>
      <button
        type="button"
        className="lp-campaign-results"
        style={reveal(progress, 0.66)}
        onClick={() => inspect(t("campaign.steps.3.title"), 2)}
        aria-label={t("view", { name: t("campaign.steps.3.label") })}
      >
        <NodeHead icon={CheckCheck}>{t("campaign.steps.3.label")}</NodeHead>
        {items("delivery").map((label, index) => (
          <div key={label}>
            <span>{label}</span>
            <b>
              {Math.round(
                Number(t(`deliveryValues.${index}`)) *
                  clamp((progress - 0.67) / 0.28)
              )}
            </b>
            <i style={{ width: `${[100, 96, 30][index]}%` }} />
          </div>
        ))}
      </button>
    </div>
  );
}

export function ProductExperience({ kind, reduced }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  const { progress, playing, pinned, seek, toggle } = useTrack(ref, reduced);
  const [flat, setFlat] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 1100, height: 450 });
  const [detail, setDetail] = useState(null);
  const steps = items(`${kind}.steps`);
  const active = Math.min(
    steps.length - 1,
    Math.floor(progress * steps.length)
  );
  const Icon = ICONS[kind];
  const nextKind = TRACKS[TRACKS.indexOf(kind) + 1];
  const actualProgress = useSceneProgress(reduced ? 1 : progress, reduced);
  const compact = size.width < 600;
  const camera = cameraAt(kind, actualProgress, compact);
  const scale = Math.min(
    size.width / camera.width,
    size.height / camera.height
  );
  useEffect(() => {
    // Commit measurements in the next frame, outside ResizeObserver delivery.
    // Changing the pinned layout must not trigger another layout in that cycle.
    let frame;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize(current =>
          current.width === width && current.height === height
            ? current
            : { width, height }
        );
      });
    });
    observer.observe(sceneRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  const inspect = (name, index) => {
    seek(progress);
    setDetail({ name, index });
  };
  return (
    <section
      ref={ref}
      id={IDS[kind]}
      className={`lp-experience ${pinned ? "is-pinned" : ""}`}
      aria-labelledby={`${kind}-title`}
    >
      <div className="lp-experience-sticky">
        <div className="lp-experience-heading lp-wrap">
          <div>
            <span className="lp-kicker">
              <Icon size={15} />
              {t(`${kind}.eyebrow`)}
            </span>
            <h2 id={`${kind}-title`}>
              {t(`${kind}.title`)}
              <em>{t(`${kind}.highlight`)}</em>
            </h2>
          </div>
          <div>
            <p>{t(`${kind}.description`)}</p>
            <small>
              <ArrowDown size={14} />
              {t("scroll")}
            </small>
          </div>
        </div>
        <div className="lp-scene-window">
          <div className="lp-scene-toolbar">
            <img
              src={`${process.env.PUBLIC_URL || ""}/branding/espaco-whats-icon.png`}
              alt=""
              width="24"
              height="24"
            />
            <span>{t(`${kind}.workspace`)}</span>
            <small>{t("demonstration")}</small>
            <span className="lp-scene-status">
              <Check size={13} />
              {t("ready")}
            </span>
          </div>
          <div
            className="lp-scene-stage"
            ref={sceneRef}
            onPointerMove={event => {
              if (reduced || compact || event.pointerType !== "mouse") return;
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--pointer-x",
                `${((event.clientX - bounds.left) / bounds.width - 0.5) * 1.7}deg`
              );
              event.currentTarget.style.setProperty(
                "--pointer-y",
                `${((event.clientY - bounds.top) / bounds.height - 0.5) * -1.4}deg`
              );
            }}
            onPointerLeave={event => {
              event.currentTarget.style.setProperty("--pointer-x", "0deg");
              event.currentTarget.style.setProperty("--pointer-y", "0deg");
            }}
          >
            <div
              className={`lp-scene-world ${flat || reduced ? "is-flat" : ""}`}
              style={{
                "--scene-scale": scale * zoom,
                "--scene-x": `${520 - camera.x}px`,
                "--scene-y": `${230 - camera.y}px`,
                "--camera-x": `${camera.x}px`,
                "--camera-y": `${camera.y}px`
              }}
            >
              {kind === "crm" ? (
                <CrmScene progress={actualProgress} inspect={inspect} />
              ) : kind === "campaign" ? (
                <CampaignScene progress={actualProgress} inspect={inspect} />
              ) : (
                <FlowScene
                  kind={kind}
                  progress={actualProgress}
                  inspect={inspect}
                  reduced={reduced}
                />
              )}
            </div>
            <small className="lp-scene-disclaimer">{t("illustration")}</small>
            <div className="lp-scene-camera">
              <button
                type="button"
                onClick={() => setFlat(v => !v)}
                aria-label={t(flat ? "perspective" : "flat")}
                aria-pressed={!flat}
              >
                <Layers size={15} />
                {flat ? "2D" : "3D"}
              </button>
              <button
                type="button"
                disabled={zoom <= 0.7}
                onClick={() => setZoom(v => Math.max(0.7, v - 0.15))}
                aria-label={t("zoomOut")}
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setFlat(false);
                }}
                aria-label={t("fit")}
              >
                <Maximize size={15} />
              </button>
              <button
                type="button"
                disabled={zoom >= 1.4}
                onClick={() => setZoom(v => Math.min(1.4, v + 0.15))}
                aria-label={t("zoomIn")}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="lp-scene-playback">
            <button
              type="button"
              onClick={toggle}
              disabled={reduced}
              aria-label={t(playing ? "pause" : "play")}
              aria-pressed={playing}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <input
              type="range"
              min="0"
              max="1000"
              value={Math.round(progress * 1000)}
              onChange={e => seek(Number(e.target.value) / 1000)}
              aria-label={t("progress", { name: t(`${kind}.nav`) })}
              style={{ "--range-progress": `${progress * 100}%` }}
            />
            <span>
              0{active + 1} / 0{steps.length}
            </span>
            <button
              type="button"
              onClick={() => seek(0)}
              aria-label={t("restart")}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <div className="lp-scene-caption lp-wrap">
          <span>
            0{active + 1}
            <i>/</i>
          </span>
          <div>
            <h3>{steps[active].title}</h3>
            <p>{steps[active].description}</p>
          </div>
          <div className="lp-scene-arrows">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => seek((active - 1 + 0.25) / steps.length)}
              aria-label={t("previous")}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={active === steps.length - 1}
              onClick={() =>
                seek(Math.min(1, (active + 1 + 0.5) / steps.length))
              }
              aria-label={t("next")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <nav className="lp-scene-steps" aria-label={t(`${kind}.nav`)}>
          {steps.map((step, index) => (
            <button
              type="button"
              key={step.label}
              aria-pressed={active === index}
              onClick={() =>
                seek(
                  index === 0 ? 0 : Math.min(1, (index + 0.5) / steps.length)
                )
              }
            >
              <i />
              {step.label}
            </button>
          ))}
          <a href={nextKind ? `#${IDS[nextKind]}` : "#agente"}>
            <span>{t("nextExperience")}</span>
            <ArrowRight size={13} />
          </a>
        </nav>
      </div>
      <SceneDrawer
        kind={kind}
        detail={detail}
        onClose={() => setDetail(null)}
        reduced={reduced}
      />
    </section>
  );
}

export function CustomerContext() {
  return (
    <section className="lp-customer-context lp-wrap" data-lp-motion>
      <div className="lp-customer-card">
        <div className="lp-node-person">
          <Avatar />
          <div>
            <small>{t("context.tag")}</small>
            <h3>{t("contact")}</h3>
          </div>
        </div>
        <ol>
          {items("context.events").map((event, index) => (
            <li key={event}>
              <i>
                <Check size={13} />
              </i>
              <span>{event}</span>
              <time>{t(`context.times.${index}`)}</time>
            </li>
          ))}
        </ol>
        <footer>
          <CheckCheck size={18} />
          {t("preserved")}
        </footer>
        <small>{t("demonstration")}</small>
      </div>
      <div className="lp-context-copy">
        <span className="lp-kicker">{t("context.eyebrow")}</span>
        <h2>{t("context.title")}</h2>
        <p>{t("context.description")}</p>
        <p>{t("context.body")}</p>
        <strong>{t("context.highlight")}</strong>
      </div>
    </section>
  );
}

export function BrandLetter() {
  return (
    <section className="lp-brand-letter">
      <div className="lp-wrap">
        <aside>
          <img
            src={`${process.env.PUBLIC_URL || ""}/branding/espaco-whats-icon.png`}
            width="64"
            height="64"
            alt=""
          />
          <strong>{t("letter.signature")}</strong>
          <span>{t("letter.note")}</span>
        </aside>
        <article>
          <span className="lp-kicker">{t("letter.eyebrow")}</span>
          <h2>{t("letter.title")}</h2>
          {items("letter.paragraphs").map((paragraph, index) => (
            <React.Fragment key={paragraph}>
              <p>{paragraph}</p>
              {index === 1 && <blockquote>{t("letter.quote")}</blockquote>}
            </React.Fragment>
          ))}
          <a className="lp-text-link" href="#planos">
            {i18n.t("landing.story.start")}
            <ArrowUpRight size={18} />
          </a>
        </article>
      </div>
    </section>
  );
}
