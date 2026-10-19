import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  GitBranch,
  MessageCircle,
  Users,
  X
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import "./scene-drawer.css";

const t = (key, options) => i18n.t(`landing.motion.${key}`, options);

export default function SceneDrawer({ kind, detail, onClose, reduced }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const [closing, setClosing] = useState(false);
  const Icon =
    kind === "automation" ? GitBranch : kind === "crm" ? Users : MessageCircle;
  const copy = detail
    ? t(`drawer.${kind}.${detail.index}`, { returnObjects: true })
    : null;

  useEffect(() => {
    const dialog = ref.current;
    if (!detail) return undefined;
    setClosing(false);
    dialog.showModal();
    const root = document.getElementById("root");
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      clearTimeout(timer.current);
      dialog.close();
      root.style.overflow = previous;
    };
  }, [detail]);

  const close = () => {
    if (closing) return;
    setClosing(true);
    timer.current = setTimeout(onClose, reduced ? 0 : 320);
  };

  return (
    <dialog
      ref={ref}
      className={`lp-detail-overlay ${closing ? "is-closing" : ""} ${reduced ? "is-reduced" : ""}`}
      aria-labelledby={`${kind}-detail-title`}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {detail && copy && (
        <div className="lp-detail-sheet">
          <header className="lp-detail-topbar">
            <span>{t(`${kind}.nav`)}</span>
            <button type="button" onClick={close} aria-label={t("close")}>
              <X size={20} />
            </button>
          </header>
          <div className="lp-detail-body">
            <span className="lp-detail-icon">
              <Icon size={32} strokeWidth={1.5} />
            </span>
            <span className="lp-kicker">{t("drawer.eyebrow")}</span>
            <h2 id={`${kind}-detail-title`}>{detail.name}</h2>
            <p className="lp-detail-description">{copy.description}</p>
            <div className="lp-detail-connected">
              <CheckCheck size={18} />
              <span>
                {t("drawer.connected")}
                <b>{copy.outcome}</b>
              </span>
            </div>

            <div className={`lp-detail-preview is-${kind}`}>
              <div className="lp-detail-preview-bar">
                <span />
                <span />
                <span />
                <small>{t("demonstration")}</small>
              </div>
              <div className="lp-detail-contact">
                <span>MC</span>
                <div>
                  <b>{t("contact")}</b>
                  <small>{t("tags.1")}</small>
                </div>
                <span className="lp-detail-online" />
              </div>
              {kind === "automation" ? (
                <div className="lp-detail-branches">
                  <div>
                    <GitBranch size={19} />
                    {t("condition")}
                  </div>
                  <i />
                  <section>
                    {["sales", "support"].map(key => (
                      <span key={key}>
                        <Users size={16} />
                        {t(key)}
                        <Check size={14} />
                      </span>
                    ))}
                  </section>
                </div>
              ) : kind === "crm" ? (
                <div className="lp-detail-pipeline">
                  {t("labels", { returnObjects: true }).map((label, index) => (
                    <div key={label}>
                      <i>{index + 1}</i>
                      <span>{label}</span>
                      <Check size={14} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lp-detail-conversation">
                  <p>
                    {t("incoming")}
                    <small>09:41</small>
                  </p>
                  <p>
                    {t(kind === "campaign" ? "campaignMessage" : "reply")}
                    <small>
                      09:42 <CheckCheck size={14} />
                    </small>
                  </p>
                </div>
              )}
              <footer>
                <Check size={14} />
                {t("preserved")}
              </footer>
            </div>

            <h3>{t("drawer.how")}</h3>
            <ol className="lp-detail-benefits">
              {copy.points.map((point, index) => (
                <li key={point}>
                  <span>0{index + 1}</span>
                  {point}
                </li>
              ))}
            </ol>
            <small className="lp-detail-note">{t("detailHint")}</small>
          </div>
          <footer className="lp-detail-footer">
            <button type="button" onClick={close}>
              {t("drawer.continue")}
              <ArrowRight size={17} />
            </button>
            <a href="/assinar">
              {t("drawer.start")}
              <ArrowRight size={14} />
            </a>
          </footer>
        </div>
      )}
    </dialog>
  );
}
