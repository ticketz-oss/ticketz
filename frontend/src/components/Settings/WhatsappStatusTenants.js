import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  InputAdornment,
  Switch,
  TextField,
  Typography
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { Building2, CircleDot, Search } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import "./whatsapp-status-tenants.css";

const ENDPOINT = "/whatsapp-status/admin/companies";
const t = (key, options) => i18n.t(`whatsappStatusTenants.${key}`, options);
const cancelled = error =>
  error?.code === "ERR_CANCELED" || error?.name === "AbortError";
const requestError = (error, fallback) =>
  error?.response?.status === 403 || error?.response?.status === 401
    ? t("forbidden")
    : t(fallback);

export default function WhatsappStatusTenants() {
  const { user } = useContext(AuthContext);
  const superAdmin = Boolean(user?.super);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState({});
  const [listVersion, setListVersion] = useState(0);
  const mounted = useRef(true);
  const searchRef = useRef(search);
  searchRef.current = search;

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
      setLoading(true);
      setListError("");
      try {
        const { data } = await api.get(ENDPOINT, {
          params: { searchParam: search, pageNumber: 1 },
          signal: controller.signal
        });
        if (controller.signal.aborted) return;
        setCompanies(data?.companies || []);
        setHasMore(Boolean(data?.hasMore));
        setPage(1);
      } catch (failure) {
        if (!cancelled(failure) && !controller.signal.aborted)
          setListError(requestError(failure, "loadError"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, listVersion, superAdmin]);

  const loadMore = async () => {
    const requestedSearch = search;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINT, {
        params: { searchParam: search, pageNumber: nextPage }
      });
      if (!mounted.current || searchRef.current !== requestedSearch) return;
      setCompanies(current =>
        [...current, ...(data?.companies || [])].filter(
          (company, index, list) =>
            list.findIndex(item => item.id === company.id) === index
        )
      );
      setHasMore(Boolean(data?.hasMore));
      setPage(nextPage);
    } catch (failure) {
      if (mounted.current && searchRef.current === requestedSearch)
        setListError(requestError(failure, "loadError"));
    } finally {
      if (mounted.current && searchRef.current === requestedSearch)
        setLoading(false);
    }
  };

  const setCompanyFlag = (id, enabled) =>
    setCompanies(current =>
      current.map(company =>
        company.id === id
          ? { ...company, whatsappStatusEnabled: enabled }
          : company
      )
    );

  const toggle = async (company, enabled) => {
    const previous = company.whatsappStatusEnabled;
    setSaveError("");
    setSaving(current => ({ ...current, [company.id]: true }));
    setCompanyFlag(company.id, enabled);
    try {
      const { data } = await api.put(`${ENDPOINT}/${company.id}`, {
        enabled
      });
      if (!mounted.current) return;
      setCompanyFlag(company.id, data?.whatsappStatusEnabled === true);
      toast.success(
        t(data?.whatsappStatusEnabled ? "savedEnabled" : "savedDisabled", {
          name: company.name
        })
      );
    } catch (failure) {
      if (!mounted.current) return;
      setCompanyFlag(company.id, previous);
      setSaveError(requestError(failure, "saveError"));
    } finally {
      if (mounted.current)
        setSaving(current => {
          const next = { ...current };
          delete next[company.id];
          return next;
        });
    }
  };

  if (!superAdmin) return null;
  return (
    <section
      className="status-tenants"
      aria-label={i18n.t("centralConfig.itens.statusWhatsapp.titulo")}
    >
      <header className="status-tenants-intro">
        <CircleDot size={24} aria-hidden="true" />
        <div>
          <Typography variant="h6">{t("title")}</Typography>
          <Typography variant="body2" color="textSecondary">
            {t("description")}
          </Typography>
        </div>
      </header>
      <TextField
        id="status-tenants-search"
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
      {listError && (
        <Alert
          severity="error"
          className="status-tenants-alert"
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
          {listError}
        </Alert>
      )}
      {saveError && (
        <Alert
          severity="error"
          className="status-tenants-alert"
          onClose={() => setSaveError("")}
        >
          {saveError}
        </Alert>
      )}
      <ul className="status-tenants-list" aria-label={t("companies")}>
        {companies.map(company => {
          const enabled = company.whatsappStatusEnabled === true;
          const stateId = `status-tenant-${company.id}-state`;
          return (
            <li key={company.id}>
              <label className="status-tenants-company">
                <Building2 size={18} aria-hidden="true" />
                <span className="status-tenants-text">
                  <strong>{company.name}</strong>
                  <small>{t("companyId", { id: company.id })}</small>
                  <small
                    id={stateId}
                    className={enabled ? "status-tenants-enabled" : ""}
                  >
                    {enabled ? t("enabled") : t("disabled")}
                  </small>
                  {company.whatsappMode === "meta" && (
                    <small className="status-tenants-note">
                      {t("metaNote")}
                    </small>
                  )}
                </span>
                <Switch
                  color="primary"
                  checked={enabled}
                  disabled={Boolean(saving[company.id])}
                  onChange={event => toggle(company, event.target.checked)}
                  inputProps={{
                    "aria-label": company.name,
                    "aria-describedby": stateId
                  }}
                />
              </label>
            </li>
          );
        })}
      </ul>
      {loading ? (
        <p role="status" className="status-tenants-muted">
          {t("loading")}
        </p>
      ) : !companies.length && !listError ? (
        <p className="status-tenants-muted">{t("noCompanies")}</p>
      ) : null}
      {hasMore && (
        <Button onClick={loadMore} disabled={loading}>
          {t("more")}
        </Button>
      )}
    </section>
  );
}
