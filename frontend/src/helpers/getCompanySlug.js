import config from "../services/config";

// Slugs reservados (colidem com hostnames de infra) — nunca viram empresa.
const RESERVED = new Set([
  "www",
  "app",
  "api",
  "admin",
  "backend",
  "frontend"
]);

const sanitize = label => {
  const slug = (label || "").toLowerCase();
  if (!slug || RESERVED.has(slug) || !/^[a-z0-9-]+$/.test(slug)) {
    return "";
  }
  return slug;
};

// Deriva o slug (subdominio) da empresa a partir do hostname atual.
// Retorna "" quando nao ha slug (apex / www / localhost / IP / dominio nao
// reconhecido) — nesse caso o backend cai na empresa master (1).
//
// Producao: define-se APP_BASE_DOMAIN (via config.json), ex. "meusite.com.br";
// o slug e' o primeiro label de "<slug>.meusite.com.br". Evita o problema de
// TLD composto (.com.br) ao nao usar contagem de labels.
// Dev: "<slug>.localhost" e' reconhecido automaticamente.
export const getCompanySlug = () => {
  const host = (window.location.hostname || "").toLowerCase();

  if (
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":") // IPv6 literal
  ) {
    return "";
  }

  // Dev: *.localhost (Chrome/Firefox resolvem para 127.0.0.1)
  if (host.endsWith(".localhost")) {
    return sanitize(host.slice(0, host.length - ".localhost".length).split(".")[0]);
  }

  const baseDomain = ((config && config.APP_BASE_DOMAIN) || "").toLowerCase();
  if (baseDomain && host !== baseDomain && host.endsWith(`.${baseDomain}`)) {
    const prefix = host.slice(0, host.length - baseDomain.length - 1);
    return sanitize(prefix.split(".")[0]);
  }

  return "";
};

export default getCompanySlug;
