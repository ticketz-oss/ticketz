import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  Typography
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { Building2, Check, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import "./agent-context.css";

const t = (key, options) => i18n.t(`agentManagement.${key}`, options);
const stateLabel = state =>
  t(
    `documentStates.${["pending", "ready", "partial", "error", "blocked", "disabled"].includes(state) ? state : "unknown"}`
  );
const configuration = value => ({
  enabled: value.enabled,
  modules: value.modules || {},
  businessContext: value.businessContext || "",
  revision: value.revision
});
const signature = value => JSON.stringify(configuration(value));
const cancelled = error =>
  error?.code === "ERR_CANCELED" || error?.name === "AbortError";
const requestError = (error, fallback) =>
  error?.response?.status === 403 ? t("forbidden") : t(fallback);

// React renders every fragment as text. Customer Markdown cannot insert HTML,
// load remote images or run scripts in this administrative preview.
export function BusinessMarkdownPreview({ value }) {
  if (!value?.trim())
    return <p className="agent-context-muted">{t("previewEmpty")}</p>;
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const nodes = [];
  let code = null;
  const inline = text =>
    text
      .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
      .map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : part.startsWith("`") && part.endsWith("`") ? (
          <code key={index}>{part.slice(1, -1)}</code>
        ) : (
          part
        )
      );
  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (code === null) code = [];
      else {
        nodes.push(
          <pre key={`code-${index}`}>
            <code>{code.join("\n")}</code>
          </pre>
        );
        code = null;
      }
      return;
    }
    if (code !== null) {
      code.push(line);
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      nodes.push(
        React.createElement(
          `h${heading[1].length}`,
          { key: index },
          inline(heading[2])
        )
      );
      return;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      nodes.push(
        <ul key={index}>
          <li>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
        </ul>
      );
      return;
    }
    if (line.startsWith("> ")) {
      nodes.push(<blockquote key={index}>{inline(line.slice(2))}</blockquote>);
      return;
    }
    if (line.trim()) nodes.push(<p key={index}>{inline(line)}</p>);
  });
  if (code !== null)
    nodes.push(
      <pre key="unfinished-code">
        <code>{code.join("\n")}</code>
      </pre>
    );
  return <div className="agent-context-markdown">{nodes}</div>;
}

export default function AgentContextManager() {
  const { user } = useContext(AuthContext);
  const superAdmin = Boolean(user?.super);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companyPage, setCompanyPage] = useState(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [contextVersion, setContextVersion] = useState(0);
  const mounted = useRef(true);
  const searchRef = useRef(search);
  searchRef.current = search;
  const dirty = Boolean(policy && baseline !== signature(policy));
  const documentState = policy?.documentStatus?.state;
  const busy = saving || rebuilding;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!superAdmin) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCompaniesLoading(true);
      setCompaniesError("");
      try {
        const { data } = await api.get("/agent/admin/companies", {
          params: { search },
          signal: controller.signal
        });
        if (controller.signal.aborted) return;
        setCompanies(Array.isArray(data) ? data : data.companies || []);
        setCompanyPage(Array.isArray(data) ? null : data.nextCursor || null);
      } catch (failure) {
        if (!cancelled(failure) && !controller.signal.aborted)
          setCompaniesError(requestError(failure, "loadError"));
      } finally {
        if (!controller.signal.aborted) setCompaniesLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, listVersion, superAdmin]);

  useEffect(() => {
    if (!superAdmin || !selected) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setConflict(false);
    setPolicy(null);
    api
      .get(`/agent/admin/companies/${selected.id}/context`, {
        signal: controller.signal
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setPolicy(data);
          setBaseline(signature(data));
        }
      })
      .catch(failure => {
        if (!cancelled(failure) && !controller.signal.aborted)
          setError(requestError(failure, "loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selected, contextVersion, superAdmin]);

  useEffect(() => {
    if (!superAdmin || !selected || documentState !== "pending")
      return undefined;
    const controller = new AbortController();
    const poll = setInterval(() => {
      api
        .get(`/agent/admin/companies/${selected.id}/context`, {
          signal: controller.signal
        })
        .then(({ data }) => {
          if (!controller.signal.aborted)
            setPolicy(
              current =>
                current && { ...current, documentStatus: data.documentStatus }
            );
        })
        .catch(() => {
          /* Polling failures keep the last known status visible. */
        });
    }, 5000);
    return () => {
      clearInterval(poll);
      controller.abort();
    };
  }, [selected, documentState, superAdmin]);

  const selectCompany = company => {
    if (company.id === selected?.id) return;
    if (dirty) setPendingSelection(company);
    else setSelected(company);
  };
  const reload = () => {
    if (dirty) setPendingSelection({ reload: true });
    else setContextVersion(value => value + 1);
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(
        `/agent/admin/companies/${selected.id}/context`,
        configuration(policy)
      );
      if (!mounted.current) return;
      const next = { ...policy, ...data };
      setPolicy(next);
      setBaseline(signature(next));
      setConflict(false);
      window.dispatchEvent(new Event("agent-availability-changed"));
      setCompanies(current =>
        current.map(company =>
          company.id === selected.id
            ? { ...company, enabled: data.enabled }
            : company
        )
      );
      toast.success(t("saved"));
    } catch (failure) {
      if (!mounted.current) return;
      const isConflict = failure?.response?.status === 409;
      setConflict(isConflict);
      setError(isConflict ? t("conflict") : requestError(failure, "saveError"));
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const rebuild = async () => {
    setRebuilding(true);
    setError("");
    try {
      await api.post(`/agent/admin/companies/${selected.id}/context/rebuild`);
      if (mounted.current) {
        setPolicy(current => ({
          ...current,
          documentStatus: { ...current.documentStatus, state: "pending" }
        }));
        toast.success(t("rebuildRequested"));
      }
    } catch (failure) {
      if (mounted.current) setError(requestError(failure, "rebuildError"));
    } finally {
      if (mounted.current) setRebuilding(false);
    }
  };
  const loadMore = async () => {
    const requestedSearch = search;
    setCompaniesLoading(true);
    try {
      const { data } = await api.get("/agent/admin/companies", {
        params: { search, cursor: companyPage }
      });
      if (mounted.current && searchRef.current === requestedSearch) {
        setCompanies(current =>
          [...current, ...(data.companies || [])].filter(
            (company, index, list) =>
              list.findIndex(item => item.id === company.id) === index
          )
        );
        setCompanyPage(data.nextCursor || null);
      }
    } catch (failure) {
      if (mounted.current && searchRef.current === requestedSearch)
        setCompaniesError(requestError(failure, "loadError"));
    } finally {
      if (mounted.current && searchRef.current === requestedSearch)
        setCompaniesLoading(false);
    }
  };

  if (!superAdmin) return null;
  const catalog = policy?.catalog || [];
  const available = policy?.enabled
    ? catalog.filter(module => policy.modules[module.key] !== false).length
    : 0;
  return (
    <section
      className="agent-context-manager"
      aria-label={i18n.t("centralConfig.itens.luizaAgent.titulo")}
    >
      <header className="agent-context-intro">
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <Typography variant="h6">{t("title")}</Typography>
          <Typography variant="body2" color="textSecondary">
            {t("description")}
          </Typography>
        </div>
      </header>
      <div className="agent-context-layout">
        <aside className="agent-context-companies" aria-label={t("companies")}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={t("search")}
            value={search}
            onChange={event => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              )
            }}
          />
          {companiesError && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setListVersion(value => value + 1)}
                >
                  {t("retry")}
                </Button>
              }
            >
              {companiesError}
            </Alert>
          )}
          <div className="agent-context-company-list">
            {companies.map(company => (
              <button
                key={company.id}
                type="button"
                disabled={busy}
                aria-pressed={company.id === selected?.id}
                className="agent-context-company"
                onClick={() => selectCompany(company)}
              >
                <Building2 size={18} aria-hidden="true" />
                <span>
                  <strong>{company.name}</strong>
                  <small>
                    {company.slug || t("companyId", { id: company.id })}
                  </small>
                  <small
                    className={company.enabled ? "agent-context-enabled" : ""}
                  >
                    {company.enabled ? t("enabled") : t("disabled")}
                  </small>
                </span>
                {company.id === selected?.id && (
                  <Check size={16} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
          {companiesLoading ? (
            <p role="status" className="agent-context-muted">
              {t("loading")}
            </p>
          ) : !companies.length && !companiesError ? (
            <p className="agent-context-muted">{t("noCompanies")}</p>
          ) : null}
          {companyPage && (
            <Button onClick={loadMore} disabled={companiesLoading}>
              {t("more")}
            </Button>
          )}
        </aside>
        <div className="agent-context-details">
          {!selected && (
            <div className="agent-context-empty">
              <Building2 size={32} />
              <Typography color="textSecondary">
                {t("selectCompany")}
              </Typography>
            </div>
          )}
          {loading && (
            <div className="agent-context-empty" role="status">
              <CircularProgress size={24} />
              <span>{t("loading")}</span>
            </div>
          )}
          {error && (
            <Alert
              severity="error"
              action={
                !policy || conflict ? (
                  <Button color="inherit" size="small" onClick={reload}>
                    {conflict ? t("reload") : t("retry")}
                  </Button>
                ) : undefined
              }
            >
              {error}
            </Alert>
          )}
          {policy && (
            <>
              <section className="agent-context-card">
                <div className="agent-context-card-heading">
                  <div>
                    <Typography variant="h6">{selected.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t("companyId", { id: selected.id })}
                    </Typography>
                  </div>
                  <Chip
                    size="small"
                    label={policy.enabled ? t("enabled") : t("disabled")}
                    color={policy.enabled ? "primary" : "default"}
                  />
                </div>
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={policy.enabled}
                      onChange={event => {
                        const checked = event.target.checked;
                        setPolicy(current => ({
                          ...current,
                          enabled: checked
                        }));
                      }}
                      disabled={busy}
                    />
                  }
                  label={t("agentEnabled")}
                />
                <Typography variant="body2" color="textSecondary">
                  {t("immediate")}
                </Typography>
              </section>
              <section className="agent-context-card">
                <div className="agent-context-card-heading">
                  <Typography variant="subtitle1">{t("modules")}</Typography>
                  <span className="agent-context-muted">
                    {t("moduleCount", {
                      allowed: available,
                      total: catalog.length
                    })}
                  </span>
                </div>
                <Typography variant="body2" color="textSecondary">
                  {t("modulesDescription")}
                </Typography>
                <div className="agent-context-module-list">
                  {catalog.map(module => (
                    <label key={module.key} className="agent-context-module">
                      <span>
                        <strong>{module.title}</strong>
                        <small>{module.description}</small>
                      </span>
                      <Switch
                        color="primary"
                        checked={policy.modules[module.key] !== false}
                        disabled={busy || !policy.enabled}
                        inputProps={{ "aria-label": module.title }}
                        onChange={event => {
                          const checked = event.target.checked;
                          setPolicy(current => ({
                            ...current,
                            modules: {
                              ...current.modules,
                              [module.key]: checked
                            }
                          }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section className="agent-context-card">
                <Typography variant="subtitle1">{t("business")}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {t("businessDescription")}
                </Typography>
                <div
                  className="agent-context-editor-tabs"
                  role="group"
                  aria-label={t("business")}
                >
                  <Button
                    size="small"
                    color={preview ? "default" : "primary"}
                    aria-pressed={!preview}
                    onClick={() => setPreview(false)}
                  >
                    {t("editor")}
                  </Button>
                  <Button
                    size="small"
                    color={preview ? "primary" : "default"}
                    aria-pressed={preview}
                    onClick={() => setPreview(true)}
                  >
                    {t("preview")}
                  </Button>
                </div>
                {preview ? (
                  <div className="agent-context-preview">
                    <BusinessMarkdownPreview value={policy.businessContext} />
                  </div>
                ) : (
                  <TextField
                    multiline
                    fullWidth
                    variant="outlined"
                    minRows={10}
                    maxRows={22}
                    value={policy.businessContext}
                    disabled={busy}
                    placeholder={t("businessPlaceholder")}
                    inputProps={{
                      maxLength: 50000,
                      "aria-label": t("business"),
                      className: "agent-context-editor"
                    }}
                    onChange={event => {
                      const value = event.target.value;
                      setPolicy(current => ({
                        ...current,
                        businessContext: value
                      }));
                    }}
                  />
                )}
                <div className="agent-context-editor-footer">
                  <small>{t("privacy")}</small>
                  <small>
                    {t("characterCount", {
                      count: policy.businessContext.length.toLocaleString(
                        i18n.language
                      )
                    })}
                  </small>
                </div>
              </section>
              <section className="agent-context-card">
                <div className="agent-context-card-heading">
                  <Typography variant="subtitle1">{t("documents")}</Typography>
                  <Chip size="small" label={stateLabel(documentState)} />
                </div>
                <Typography variant="body2" color="textSecondary">
                  {t("documentsDescription")}
                </Typography>
                <p className="agent-context-muted">
                  {policy.documentStatus?.updatedAt
                    ? t("lastUpdate", {
                        date: new Date(
                          policy.documentStatus.updatedAt
                        ).toLocaleString(i18n.language)
                      })
                    : t("neverUpdated")}
                </p>
                <div className="agent-context-document-list">
                  {catalog.map(module => {
                    const status = policy.documentStatus?.modules?.[module.key];
                    const effectiveState = !policy.enabled
                      ? "disabled"
                      : policy.modules[module.key] === false
                        ? "blocked"
                        : status?.state;
                    return (
                      <div key={module.key} className="agent-context-document">
                        <span>
                          <strong>{module.title}</strong>
                          {typeof status?.recordCount === "number" &&
                            effectiveState !== "blocked" &&
                            effectiveState !== "disabled" && (
                              <small>
                                {t("records", { count: status.recordCount })}
                              </small>
                            )}
                          {status?.failures?.length > 0 &&
                            effectiveState !== "blocked" &&
                            effectiveState !== "disabled" && (
                              <small className="agent-context-warning">
                                {t("failures", {
                                  sources: status.failures.join(", ")
                                })}
                              </small>
                            )}
                        </span>
                        <span className="agent-context-muted">
                          {stateLabel(effectiveState)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={16} />}
                  onClick={rebuild}
                  disabled={
                    busy || !policy.enabled || documentState === "pending"
                  }
                >
                  {documentState === "pending" || rebuilding
                    ? t("rebuilding")
                    : t("rebuild")}
                </Button>
              </section>
              <footer className="agent-context-actions">
                <span className="agent-context-muted">
                  {dirty ? t("unsaved") : ""}
                </span>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!dirty || busy || conflict}
                  onClick={save}
                >
                  {saving ? t("saving") : t("save")}
                </Button>
              </footer>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={Boolean(pendingSelection)}
        onClose={() => setPendingSelection(null)}
        aria-labelledby="agent-context-discard-title"
      >
        <DialogTitle id="agent-context-discard-title">
          {t("discardTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t("discardDescription")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingSelection(null)}>
            {t("cancel")}
          </Button>
          <Button
            color="primary"
            onClick={() => {
              if (pendingSelection.reload)
                setContextVersion(value => value + 1);
              else setSelected(pendingSelection);
              setPendingSelection(null);
            }}
          >
            {t("discard")}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
