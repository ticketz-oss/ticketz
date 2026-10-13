import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Download,
  FileText,
  KeyRound,
  Layers,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Sun,
  X
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import {
  apiLink,
  baseUrl,
  curlExample,
  flowExamples,
  mediaExample,
  refreshExample
} from "./examples";
import "./styles.css";

const ApiReference = lazy(() => import("./ApiReference"));
const t = (key, options) =>
  i18n.t(`documentation.${key}`, {
    interpolation: { escapeValue: false },
    ...options
  });
const list = key => t(key, { returnObjects: true });
const chapters = [
  "inicio",
  "primeira-mensagem",
  "autenticacao",
  "arquivos",
  "recursos",
  "catalogo",
  "respostas",
  "eventos"
];
const chapterIcons = [
  BookOpen,
  MessageSquare,
  KeyRound,
  FileText,
  Layers,
  Search,
  CheckCircle2,
  Code2
];
const initialChapter = () =>
  chapters.includes(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "inicio";
const brandIcon = "/branding/espaco-whats-icon.png";

function CodeBlock({ value, label = "cURL" }) {
  const [status, setStatus] = useState("");
  useEffect(() => {
    setStatus("");
  }, [value]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("copyError");
    }
  };
  return (
    <div className="docs-code">
      <div className="docs-code-toolbar">
        <span>{label}</span>
        <button
          onClick={copy}
          aria-label={t(status === "copied" ? "copied" : "copy")}
          title={t("copy")}
        >
          {status === "copied" ? <Check size={15} /> : <Copy size={15} />}
          <span>{t(status === "copied" ? "copied" : "copy")}</span>
        </button>
      </div>
      <pre tabIndex={0}>
        <code>{value}</code>
      </pre>
      <span
        className={status === "copyError" ? "docs-code-error" : "docs-sr-only"}
        role="status"
      >
        {status && t(status)}
      </span>
    </div>
  );
}

class ReferenceBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="docs-load" role="alert">
        <p>{t("loadError")}</p>
        <button onClick={() => window.location.reload()}>{t("retry")}</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function Flow() {
  const [step, setStep] = useState(0);
  const labels = list("overview.flowLabels");
  const active = flowExamples[step];
  return (
    <section className="docs-flow" id="fluxo">
      <h2>{t("overview.flowTitle")}</h2>
      <p>{t("overview.flowDescription")}</p>
      <div
        className="docs-flow-steps"
        role="tablist"
        aria-label={t("overview.flowTitle")}
      >
        {labels.map((label, index) => (
          <button
            key={label}
            id={`step-${index}`}
            role="tab"
            type="button"
            aria-selected={step === index}
            aria-controls="flow-example"
            tabIndex={step === index ? 0 : -1}
            onClick={() => setStep(index)}
            onKeyDown={event => {
              let next;
              if (event.key === "ArrowRight") next = (step + 1) % 4;
              if (event.key === "ArrowLeft") next = (step + 3) % 4;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = 3;
              if (next !== undefined) {
                event.preventDefault();
                setStep(next);
                document.getElementById(`step-${next}`)?.focus();
              }
            }}
          >
            <span>{index + 1}</span>
            {label}
            {index < 3 && <ChevronRight size={16} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div
        className="docs-flow-example"
        role="tabpanel"
        id="flow-example"
        aria-labelledby={`step-${step}`}
        tabIndex={0}
      >
        <div className="docs-endpoint">
          <span className="docs-method docs-method-post">{active.method}</span>
          <code>{active.path}</code>
          <span className="docs-sample">{t("sample")}</span>
        </div>
        <CodeBlock label="JSON" value={JSON.stringify(active.body, null, 2)} />
        <p>{list("overview.flowDescriptions")[step]}</p>
      </div>
    </section>
  );
}

function Catalog({ catalog }) {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [method, setMethod] = useState("");
  const [limit, setLimit] = useState(40);
  const filtered = useMemo(() => {
    const normalize = text =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const term = normalize(search.trim());
    return catalog.operations.filter(
      op =>
        (!module || op.module === module) &&
        (!method || op.method === method) &&
        normalize(
          `${op.path} ${op.summary} ${catalog.modules.find(item => item.id === op.module)?.name}`
        ).includes(term)
    );
  }, [catalog, search, module, method]);
  useEffect(() => {
    setLimit(40);
  }, [search, module, method]);
  return (
    <>
      <div className="docs-search">
        <Search size={19} aria-hidden="true" />
        <input
          aria-label={t("searchLabel")}
          placeholder={t("search")}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>
      <div className="docs-filters">
        <label>
          {t("module")}
          <select
            value={module}
            onChange={event => setModule(event.target.value)}
          >
            <option value="">{t("allModules")}</option>
            {catalog.modules.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("method")}
          <select
            value={method}
            onChange={event => setMethod(event.target.value)}
          >
            <option value="">{t("allMethods")}</option>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="docs-result-count" role="status">
        {t("results", { count: filtered.length })}
      </p>
      <div className="docs-catalog">
        {filtered.slice(0, limit).map(op => (
          <a
            key={op.id}
            className="docs-operation"
            href={apiLink(
              op.module,
              op.id,
              catalog.modules.find(item => item.id === op.module)?.name
            )}
            aria-label={t("viewEndpoint", { method: op.method, path: op.path })}
          >
            <span
              className={`docs-method docs-method-${op.method.toLowerCase()}`}
            >
              {op.method}
            </span>
            <div>
              <code>{op.path}</code>
              <p>
                {t(`auth.${op.auth}`)}
                <span> · </span>
                {t(op.reviewed ? "reviewed" : "observed")}
              </p>
            </div>
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        ))}
      </div>
      {!filtered.length && (
        <div className="docs-empty">
          <p>{t("empty")}</p>
          <button
            onClick={() => {
              setSearch("");
              setModule("");
              setMethod("");
            }}
          >
            {t("clear")}
          </button>
        </div>
      )}
      {filtered.length > limit && (
        <button
          className="docs-button docs-button-secondary"
          onClick={() => setLimit(value => value + 40)}
        >
          {t("more")}
        </button>
      )}
    </>
  );
}

function Article({ chapter, catalog }) {
  if (chapter === "inicio")
    return (
      <>
        <div className="docs-intro">
          <h1>{t("overview.title")}</h1>
          <p className="docs-lead">{t("overview.lead")}</p>
          <div className="docs-actions">
            <a className="docs-button" href="#primeira-mensagem">
              {t("overview.start")}
              <ArrowRight size={17} />
            </a>
            <a className="docs-text-link" href="/api">
              {t("overview.browse")}
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <Flow />
        <aside className="docs-note">
          <KeyRound size={22} />
          <div>
            <h3>{t("overview.noteTitle")}</h3>
            <p>{t("overview.note")}</p>
          </div>
        </aside>
        <section id="explorar">
          <h2>{t("overview.findTitle")}</h2>
          <div className="docs-paths">
            {list("overview.paths").map(item => (
              <a key={item.chapter} href={`#${item.chapter}`}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <ArrowRight size={21} />
              </a>
            ))}
          </div>
        </section>
      </>
    );
  if (chapter === "primeira-mensagem")
    return (
      <>
        <h1>{t("first.title")}</h1>
        <p className="docs-lead">{t("first.lead")}</p>
        <h2>{t("first.baseTitle")}</h2>
        <p>{t("first.baseText")}</p>
        <CodeBlock value={baseUrl} label="URL" />
        <ol className="docs-guide-steps">
          {list("first.steps").map((item, index) => (
            <li key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <CodeBlock value={curlExample(index)} />
            </li>
          ))}
        </ol>
        <h2>{t("first.beforeTitle")}</h2>
        <ul className="docs-checklist">
          {list("first.before").map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    );
  if (chapter === "autenticacao")
    return (
      <>
        <h1>{t("authentication.title")}</h1>
        <p className="docs-lead">{t("authentication.lead")}</p>
        <div className="docs-auth-list">
          {list("authentication.rows").map(item => (
            <section key={item.name}>
              <h2>{item.name}</h2>
              <code>{item.credential}</code>
              <p>{item.scope}</p>
            </section>
          ))}
        </div>
        <h2>{t("authentication.refreshTitle")}</h2>
        <p>{t("authentication.refresh")}</p>
        <CodeBlock value={refreshExample} />
        <h2>{t("authentication.tenantTitle")}</h2>
        <p>{t("authentication.tenant")}</p>
      </>
    );
  if (chapter === "arquivos")
    return (
      <>
        <h1>{t("media.title")}</h1>
        <p className="docs-lead">{t("media.lead")}</p>
        <h2>{t("media.uploadTitle")}</h2>
        <p>{t("media.upload")}</p>
        <CodeBlock value={mediaExample} />
        <h2>{t("media.templateTitle")}</h2>
        <p>{t("media.template")}</p>
        <a
          className="docs-text-link"
          href={apiLink(
            "message",
            "post-messages-ticketId-template",
            "Mensagens"
          )}
        >
          {t("reference")}
          <ArrowRight size={16} />
        </a>
        <h2>{t("media.schedulesTitle")}</h2>
        <p>{t("media.schedules")}</p>
      </>
    );
  if (chapter === "recursos")
    return (
      <>
        <h1>{t("resources.title")}</h1>
        <p className="docs-lead">{t("resources.lead")}</p>
        <div className="docs-resources">
          {catalog.modules.map(module => (
            <a
              key={module.id}
              href={apiLink(module.id)}
              aria-label={t("resources.open", { name: module.name })}
            >
              <div className="docs-resource-title">
                <h2>{module.name}</h2>
                <ArrowUpRight size={18} />
              </div>
              <p>{module.description}</p>
              <span>{t("resources.count", { count: module.count })}</span>
            </a>
          ))}
        </div>
      </>
    );
  if (chapter === "catalogo")
    return (
      <>
        <h1>{t("catalog.title")}</h1>
        <p className="docs-lead">{t("catalog.lead")}</p>
        <Catalog catalog={catalog} />
        <aside className="docs-note">
          <BookOpen size={21} />
          <p>{t("catalog.coverage")}</p>
        </aside>
      </>
    );
  if (chapter === "respostas")
    return (
      <>
        <h1>{t("responses.title")}</h1>
        <p className="docs-lead">{t("responses.lead")}</p>
        <dl className="docs-responses">
          {list("responses.rows").map(item => (
            <div key={item.code}>
              <dt>
                <code>{item.code}</code>
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
        <p>{t("responses.errors")}</p>
        <CodeBlock
          label="JSON"
          value={JSON.stringify({ error: "ERR_SESSION_EXPIRED" }, null, 2)}
        />
        <h2>{t("responses.paginationTitle")}</h2>
        <ul className="docs-checklist">
          {list("responses.pagination").map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    );
  return (
    <>
      <h1>{t("events.title")}</h1>
      <p className="docs-lead">{t("events.lead")}</p>
      {list("events.sections").map(item => (
        <section key={item.title}>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </section>
      ))}
    </>
  );
}

export default function Documentation() {
  const reference = /^\/api\/?$/.test(window.location.pathname);
  const [chapter, setChapter] = useState(initialChapter);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("documentation-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [catalog, setCatalog] = useState(null);
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [module, setModule] = useState(
    () => new URLSearchParams(window.location.search).get("modulo") || "message"
  );
  useEffect(() => {
    document.documentElement.classList.add("documentation-document");
    document.getElementById("root")?.classList.add("documentation-root");
    const change = () => {
      if (!chapters.includes(window.location.hash.slice(1))) return;
      setChapter(initialChapter());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    if (!reference) window.addEventListener("hashchange", change);
    return () => {
      document.documentElement.classList.remove("documentation-document");
      document.getElementById("root")?.classList.remove("documentation-root");
      window.removeEventListener("hashchange", change);
    };
  }, [reference]);
  useEffect(() => {
    document.documentElement.dataset.documentationTheme = dark
      ? "dark"
      : "light";
    try {
      localStorage.setItem("documentation-theme", dark ? "dark" : "light");
    } catch {}
    return () => {
      delete document.documentElement.dataset.documentationTheme;
    };
  }, [dark]);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    const read = async url => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("docs");
      return response.json();
    };
    Promise.all([
      read("/api-catalog.json"),
      reference ? read("/openapi.json") : Promise.resolve(null)
    ])
      .then(([data, schema]) => {
        if (
          !Array.isArray(data.modules) ||
          !Array.isArray(data.operations) ||
          (reference && !schema?.paths)
        )
          throw new Error("docs");
        setCatalog(data);
        setSpec(schema);
        setModule(current =>
          current === "all" || data.modules.some(item => item.id === current)
            ? current
            : "message"
        );
      })
      .catch(err => {
        if (err.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [reference, attempt]);
  const activeSpec = useMemo(() => {
    if (!spec || !catalog) return null;
    if (module === "all") return spec;
    const tag = catalog.modules.find(item => item.id === module)?.name;
    if (!tag) return spec;
    return {
      ...spec,
      tags: spec.tags.filter(item => item.name === tag),
      "x-tagGroups": [{ name: tag, tags: [tag] }],
      paths: Object.fromEntries(
        Object.entries(spec.paths)
          .map(([path, operations]) => [
            path,
            Object.fromEntries(
              Object.entries(operations).filter(([, op]) =>
                op.tags?.includes(tag)
              )
            )
          ])
          .filter(([, operations]) => Object.keys(operations).length)
      )
    };
  }, [spec, catalog, module]);
  const chooseModule = event => {
    const next = event.target.value;
    setModule(next);
    setError(false);
    window.history.replaceState(
      null,
      "",
      `/api?modulo=${encodeURIComponent(next)}`
    );
    window.scrollTo(0, 0);
  };
  return (
    <div
      className={`docs-page${reference ? " docs-page-api" : ""}`}
      data-theme={dark ? "dark" : "light"}
    >
      <Helmet>
        <title>{t(reference ? "apiTitle" : "title")}</title>
        <meta name="description" content={t("description")} />
        <html lang="pt-BR" />
        <link rel="icon" href={brandIcon} />
      </Helmet>
      <a href="#docs-main" className="docs-skip">
        {t("skip")}
      </a>
      <header className="docs-header">
        <a href="/" className="docs-brand" aria-label={t("home")}>
          <img src={brandIcon} alt="" width="35" height="35" />
          <span>
            Espaço<strong>Whats</strong>
          </span>
        </a>
        <nav className="docs-top-nav" aria-label={t("navigation")}>
          <a
            href="/documentacao"
            aria-current={!reference ? "page" : undefined}
          >
            {t("guides")}
          </a>
          <a href="/api" aria-current={reference ? "page" : undefined}>
            {t("reference")}
          </a>
        </nav>
        <div className="docs-header-actions">
          <button
            className="docs-icon-button"
            onClick={() => setDark(value => !value)}
            aria-label={t(dark ? "light" : "dark")}
            title={t(dark ? "light" : "dark")}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <a className="docs-login" href="/login">
            {t("login")}
            <ArrowUpRight size={16} />
          </a>
          {!reference && (
            <button
              className="docs-menu-button docs-icon-button"
              aria-expanded={menu}
              aria-controls="docs-navigation"
              aria-label={t(menu ? "closeMenu" : "menu")}
              onClick={() => setMenu(value => !value)}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          )}
        </div>
      </header>
      {error ? (
        <main id="docs-main" className="docs-load" role="alert">
          <p>{t("loadError")}</p>
          <button
            className="docs-button"
            onClick={() => setAttempt(value => value + 1)}
          >
            {t("retry")}
          </button>
        </main>
      ) : !catalog ? (
        <main id="docs-main" className="docs-load" role="status">
          {t("loading")}
        </main>
      ) : reference ? (
        <>
          <div className="docs-api-toolbar">
            <label>
              {t("module")}
              <select value={module} onChange={chooseModule}>
                {catalog.modules.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.count})
                  </option>
                ))}
                <option value="all">
                  {t("allModules")} ({catalog.operations.length})
                </option>
              </select>
            </label>
            <a className="docs-text-link" href="/documentacao#catalogo">
              <Search size={17} />
              {t("chapters.catalogo")}
            </a>
            <a
              className="docs-download"
              href="/openapi.json"
              download="espaco-whats-openapi.json"
            >
              <Download size={17} />
              {t("download")}
            </a>
          </div>
          <main id="docs-main" className="docs-reference" tabIndex={-1}>
            <div className="docs-api-intro">
              <p>{t("apiIntro")}</p>
              <p>{t("apiNote")}</p>
            </div>
            <ReferenceBoundary key={module}>
              <Suspense
                fallback={
                  <p className="docs-load" role="status">
                    {t("loading")}
                  </p>
                }
              >
                {activeSpec && (
                  <ApiReference
                    spec={activeSpec}
                    dark={dark}
                    onError={() => setError(true)}
                  />
                )}
              </Suspense>
            </ReferenceBoundary>
          </main>
        </>
      ) : (
        <div className="docs-layout">
          <aside
            className={`docs-sidebar ${menu ? "is-open" : ""}`}
            id="docs-navigation"
            onKeyDown={event => {
              if (event.key === "Escape") {
                setMenu(false);
                document.querySelector(".docs-menu-button")?.focus();
              }
            }}
          >
            <a href="#catalogo" className="docs-sidebar-search">
              <Search size={17} />
              {t("chapters.catalogo")}
              <ChevronRight size={16} />
            </a>
            <p className="docs-nav-label">{t("navigation")}</p>
            <nav>
              {chapters.map((item, index) => {
                const Icon = chapterIcons[index];
                return (
                  <a
                    key={item}
                    href={`#${item}`}
                    aria-current={chapter === item ? "page" : undefined}
                    onClick={() => setMenu(false)}
                  >
                    <Icon size={18} />
                    {t(`chapters.${item}`)}
                  </a>
                );
              })}
            </nav>
            <div className="docs-sidebar-bottom">
              <a href="/openapi.json" download="espaco-whats-openapi.json">
                <Download size={17} />
                {t("download")}
              </a>
              <small>{t("updated", { version: catalog.version })}</small>
            </div>
          </aside>
          <main
            id="docs-main"
            className="docs-article"
            key={chapter}
            tabIndex={-1}
          >
            <div className="docs-breadcrumb">
              <span>{t("guides")}</span>
              <ChevronRight size={13} />
              <span>{t(`chapters.${chapter}`)}</span>
            </div>
            <Article chapter={chapter} catalog={catalog} />
            <div className="docs-chapter-footer">
              {chapters.indexOf(chapter) > 0 && (
                <a href={`#${chapters[chapters.indexOf(chapter) - 1]}`}>
                  {t(`chapters.${chapters[chapters.indexOf(chapter) - 1]}`)}
                </a>
              )}
              {chapters.indexOf(chapter) < chapters.length - 1 && (
                <a
                  className="docs-next"
                  href={`#${chapters[chapters.indexOf(chapter) + 1]}`}
                >
                  {t(`chapters.${chapters[chapters.indexOf(chapter) + 1]}`)}
                  <ArrowRight size={17} />
                </a>
              )}
            </div>
          </main>
          <aside className="docs-context">
            <span className="docs-context-icon">
              <Code2 size={24} />
            </span>
            <h2>{t("reference")}</h2>
            <p>
              {t("coverage", {
                count: catalog.operations.length,
                modules: catalog.modules.length
              })}
            </p>
            <a href="/api">
              {t("overview.browse")}
              <ArrowRight size={15} />
            </a>
            <div className="docs-context-rule" />
            <p>{t("sample")}</p>
            <code>
              https://sua-empresa.
              <br />
              espacowhats.com.br
              <br />
              /backend
            </code>
          </aside>
        </div>
      )}
      <footer className="docs-footer">
        <p>{t("footer")}</p>
        <a
          href="https://github.com/GuiZeroUm/ticketz"
          target="_blank"
          rel="noreferrer"
        >
          {t("source")}
          <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
