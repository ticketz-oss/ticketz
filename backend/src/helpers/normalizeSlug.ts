import AppError from "../errors/AppError";

// Slugs que nao podem ser usados como subdominio de empresa (colidem com
// infra/hostnames reservados).
const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "backend",
  "frontend",
  "static",
  "assets",
  "public"
]);

// Normaliza e valida o slug (subdominio) de uma empresa.
// Regras: lowercase, apenas [a-z0-9-], sem hifen nas pontas, 1-63 chars
// (limite de label DNS), fora da blacklist de reservados.
// Retorna o slug normalizado, ou "" quando a entrada for vazia/undefined.
// Lanca AppError quando o formato for invalido.
export const normalizeSlug = (rawSlug?: string | null): string => {
  if (rawSlug === undefined || rawSlug === null) {
    return "";
  }

  const slug = String(rawSlug).trim().toLowerCase();

  if (slug === "") {
    return "";
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length > 63) {
    throw new AppError("ERR_COMPANY_INVALID_SLUG");
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new AppError("ERR_COMPANY_SLUG_RESERVED");
  }

  return slug;
};

export default normalizeSlug;
