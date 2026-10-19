import React, { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Moon, Sun } from "lucide-react";
import { i18n } from "../../translate/i18n";
import { signupBrandingSettings } from "./brandingSetup";
import "./branding-preview.css";

const t = key => i18n.t(`landing.motion.checkout.identity.${key}`);

export default function BrandingPreview({ images, name, color, slug }) {
  const [view, setView] = useState("login");
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [width, setWidth] = useState(640);
  const container = useRef(null);
  const frame = useRef(null);
  const draft = useRef(null);
  const origin = window.location.origin;
  const logicalWidth = mobile ? 390 : 1366;
  const logicalHeight = mobile ? 844 : 900;
  const scale = Math.min(1, width / logicalWidth);
  const payload = {
    type: "espaco-branding-preview",
    settings: signupBrandingSettings(images, name, color),
    view,
    dark,
    sidebarOpen,
    slug
  };
  draft.current = payload;
  const send = React.useCallback(
    () => frame.current?.contentWindow?.postMessage(draft.current, origin),
    [origin]
  );

  useEffect(() => {
    const observer = new ResizeObserver(entries =>
      setWidth(entries[0].contentRect.width)
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const ready = event => {
      if (
        event.origin === origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "espaco-branding-preview-ready"
      )
        send();
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [origin, send]);
  useEffect(send, [images, name, color, view, dark, sidebarOpen, slug, send]);

  const navigateTabs = event => {
    const tabs = ["login", "system", "link"];
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 2
          : (tabs.indexOf(view) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
    setView(tabs[next]);
    event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
  };

  return (
    <section className="co-live-preview" aria-labelledby="co-preview-heading">
      <h2 id="co-preview-heading">{t("previewTitle")}</h2>
      <div className="co-preview-controls">
        <div
          role="tablist"
          aria-label={t("previewViews")}
          onKeyDown={navigateTabs}
        >
          {["login", "system", "link"].map(item => (
            <button
              key={item}
              id={`co-preview-tab-${item}`}
              type="button"
              role="tab"
              tabIndex={view === item ? 0 : -1}
              aria-selected={view === item}
              aria-controls="co-preview-screen"
              onClick={() => setView(item)}
            >
              {t(`views.${item}`)}
            </button>
          ))}
        </div>
        <div className="co-preview-devices">
          <button
            type="button"
            onClick={() => setMobile(false)}
            aria-pressed={!mobile}
            aria-label={t("desktop")}
          >
            <Monitor size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobile(true)}
            aria-pressed={mobile}
            aria-label={t("mobile")}
          >
            <Smartphone size={18} />
          </button>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
            aria-label={t("darkMode")}
          >
            {dark ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
      {view === "system" && (
        <button
          type="button"
          className="co-preview-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {t(sidebarOpen ? "closeSidebar" : "openSidebar")}
        </button>
      )}
      <div
        className="co-preview-viewport"
        ref={container}
        id="co-preview-screen"
        role="tabpanel"
        aria-labelledby={`co-preview-tab-${view}`}
        style={{ height: logicalHeight * scale }}
      >
        <iframe
          ref={frame}
          src="/preview/branding"
          title={t("previewTitle")}
          onLoad={send}
          style={{
            width: logicalWidth,
            height: logicalHeight,
            left: Math.max(0, (width - logicalWidth * scale) / 2),
            transform: `scale(${scale})`
          }}
        />
      </div>
      <p className="co-preview-caption">
        {t(view === "link" ? "linkCaption" : "liveCaption")}
      </p>
    </section>
  );
}
