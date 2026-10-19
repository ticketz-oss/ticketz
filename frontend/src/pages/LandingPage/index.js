import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { getContrastRatio } from "@material-ui/core/styles";
import {
  ArrowForwardRounded,
  ArrowDownwardRounded,
  ForumOutlined,
  GroupOutlined,
  HistoryRounded,
  AccountTreeOutlined,
  AssessmentOutlined,
  CloseRounded,
  MenuRounded,
  SendRounded,
  AddRounded
} from "@material-ui/icons";
import config, { getBackendURL } from "../../services/config";
import { i18n } from "../../translate/i18n";
import useLandingMotion from "./useLandingMotion";
import { AskAgent, ModesTrack, Pieces, Plans } from "./Experience";
import "./styles.css";
import "./experience.css";
import {
  ExperienceNav,
  ProductExperience,
  CustomerContext,
  BrandLetter
} from "./Showcases";
import "./showcases.css";

const t = key => i18n.t(`landing.${key}`);
const list = key => i18n.t(`landing.${key}`, { returnObjects: true });
const stageIcons = [ForumOutlined, AccountTreeOutlined, HistoryRounded];

const brandIcon = `${process.env.PUBLIC_URL || ""}/branding/espaco-whats-icon.png`;
const BrandIcon = () => (
  <img
    className="lp-brand-icon"
    src={brandIcon}
    alt=""
    width="48"
    height="48"
  />
);

const Brand = () => (
  <span className="lp-logo">
    <span>
      <BrandIcon />
    </span>
    <strong>
      Espaço<span>Whats</span>
    </strong>
  </span>
);

const LandingPage = () => {
  const pageRef = useLandingMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const [brand, setBrand] = useState({
    primaryColorLight: "#0000FF",
    primaryColorDark: "#39ACE7"
  });
  const whatsappNumber = String(config.LANDING_WHATSAPP_NUMBER || "").replace(
    /\D/g,
    ""
  );
  const contactUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t("contact.whatsappMessage"))}`
    : "#planos";
  const featureIndexes = [0, 1, 3, 5, 7, 11];
  const featureIcons = [
    ForumOutlined,
    GroupOutlined,
    HistoryRounded,
    SendRounded,
    AccountTreeOutlined,
    AssessmentOutlined
  ];

  useEffect(() => {
    const root = document.getElementById("root");
    root?.classList.add("landing-root");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    ["primaryColorLight", "primaryColorDark"].forEach(key => {
      fetch(`${getBackendURL()}/public-settings/${key}`, {
        signal: controller.signal
      })
        .then(response => (response.ok ? response.json() : null))
        .then(value => {
          if (
            !controller.signal.aborted &&
            typeof value === "string" &&
            /^#[\da-f]{6}$/i.test(value)
          ) {
            setBrand(current => ({ ...current, [key]: value }));
          }
        })
        .catch(() => {});
    });
    return () => {
      root?.classList.remove("landing-root");
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  return (
    <div
      className={`landing-page ${reduced ? "lp-reduced" : ""}`}
      ref={pageRef}
      style={{
        "--lp-primary": brand.primaryColorLight,
        "--lp-accent": brand.primaryColorDark,
        "--lp-on-primary":
          getContrastRatio(brand.primaryColorLight, "#fff") >= 4.5
            ? "#fff"
            : "#111820"
      }}
    >
      <Helmet>
        <title>{t("meta.title")}</title>
        <meta name="description" content={t("meta.description")} />
        <link rel="icon" type="image/png" href={brandIcon} />
        <link rel="shortcut icon" type="image/png" href={brandIcon} />
      </Helmet>
      <a className="lp-skip" href="#inicio">
        {t("story.skip")}
      </a>
      <header className="lp-header">
        <a href="#inicio" aria-label={t("nav.home")} onClick={closeMenu}>
          <Brand />
        </a>
        <button
          className="lp-menu-button"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-controls="lp-navigation"
          aria-label={t("nav.menu")}
        >
          {menuOpen ? <CloseRounded /> : <MenuRounded />}
        </button>
        <nav
          id="lp-navigation"
          className={menuOpen ? "is-open" : ""}
          onKeyDown={event => {
            if (event.key === "Escape") closeMenu();
          }}
        >
          <a href="#como-funciona" onClick={closeMenu}>
            {t("nav.howItWorks")}
          </a>
          <a href="#recursos" onClick={closeMenu}>
            {t("nav.features")}
          </a>
          <a href="#conexao" onClick={closeMenu}>
            {t("nav.connection")}
          </a>
          <a href="#planos" onClick={closeMenu}>
            {t("nav.plans")}
          </a>
        </nav>
        <div className="lp-header-actions">
          <a href="/login">{t("story.login")}</a>
          <a className="lp-button lp-button--small" href="#planos">
            {t("story.start")}
            <ArrowForwardRounded />
          </a>
        </div>
      </header>
      <ExperienceNav />
      <main>
        <section className="lp-hero lp-wrap" id="inicio">
          <span className="lp-kicker">
            <i />
            {t("story.heroEyebrow")}
          </span>
          <div className="lp-hero-grid" data-lp-motion>
            <h1>
              <span>{t("motion.heroLine1")}</span>
              <span>{t("motion.heroLine2")}</span>
              <em>
                {t("motion.heroLine3")}
                <span className="lp-title-arrow" aria-hidden="true">
                  <ArrowForwardRounded />
                </span>
              </em>
            </h1>
            <div className="lp-hero-copy">
              <span className="lp-kicker">{t("story.heroAside")}</span>
              <p>{t("story.heroDescription")}</p>
              <div className="lp-actions">
                <a className="lp-button" href="#planos">
                  {t("story.start")}
                  <ArrowForwardRounded />
                </a>
                <a className="lp-text-link" href="#como-funciona">
                  {t("actions.seeHow")}
                  <ArrowDownwardRounded />
                </a>
              </div>
            </div>
          </div>
        </section>
        <Pieces reduced={reduced} />
        <AskAgent reduced={reduced} />
        {["journey", "crm", "automation", "campaign"].map(kind => (
          <ProductExperience key={kind} kind={kind} reduced={reduced} />
        ))}
        <section className="lp-features lp-wrap" id="recursos">
          <div className="lp-section-heading" data-lp-motion>
            <div>
              <span className="lp-kicker">{t("features.eyebrow")}</span>
              <h2>{t("story.featuresTitle")}</h2>
            </div>
            <p>{t("features.description")}</p>
          </div>
          <div className="lp-feature-grid">
            {featureIndexes.map((featureIndex, index) => {
              const feature = list("features.items")[featureIndex];
              const Icon = featureIcons[index];
              return (
                <article
                  key={feature.title}
                  data-lp-motion
                  style={{ "--lp-delay": `${(index % 3) * 100}ms` }}
                >
                  <div>
                    <Icon />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>
        <CustomerContext />
        <BrandLetter />
        <ModesTrack reduced={reduced} />
        <Plans whatsappNumber={whatsappNumber} />
        <section className="lp-faq lp-wrap" data-lp-motion>
          <div>
            <span className="lp-kicker">{t("faq.eyebrow")}</span>
            <h2>{t("faq.title")}</h2>
          </div>
          <div>
            {list("faq.items").map(faq => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <AddRounded />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="lp-cta" id="contato">
          <div className="lp-wrap" data-lp-motion>
            <span className="lp-kicker">{t("story.ctaEyebrow")}</span>
            <h2>
              {t("story.ctaTitle")}
              <em>{t("story.ctaHighlight")}</em>
            </h2>
            <p>{t("story.ctaDescription")}</p>
            <div className="lp-actions">
              <a className="lp-button" href="#planos">
                {t("story.start")}
                <ArrowForwardRounded />
              </a>
              <a
                className="lp-button lp-button--outline"
                href={contactUrl}
                {...(whatsappNumber
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {t(
                  whatsappNumber
                    ? "actions.talkWhatsApp"
                    : "story.createAccount"
                )}
                <ArrowForwardRounded />
              </a>
            </div>
            <div className="lp-cta-tiles" aria-hidden="true">
              {stageIcons.map((Icon, index) => (
                <span key={index}>
                  <Icon />
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="lp-footer lp-wrap">
        <Brand />
        <p>{t("footer.description")}</p>
        <nav>
          <a href="/login">{t("story.login")}</a>
          <a href="/documentacao">{i18n.t("documentation.guides")}</a>
          <a href="/api">{i18n.t("documentation.reference")}</a>
          <a href="/privacidade/">{t("footer.privacy")}</a>
          <a href="/termos/">{t("footer.terms")}</a>
          <a
            href="https://github.com/GuiZeroUm/ticketz"
            target="_blank"
            rel="noreferrer"
          >
            {t("story.source")}
          </a>
        </nav>
        <small>
          © {new Date().getFullYear()} Espaço Whats. {t("footer.rights")}
        </small>
        <button
          type="button"
          className="lp-motion-toggle"
          onClick={() => setReduced(value => !value)}
          aria-pressed={reduced}
        >
          {t(reduced ? "motion.restore" : "motion.reduce")}
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;
