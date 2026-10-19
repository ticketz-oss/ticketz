// Extrai o slug (subdominio da empresa) a partir do Host da requisicao, usando
// APP_BASE_DOMAIN. Ex.: host "espacosingular.espacowhats.com.br" + base
// "espacowhats.com.br" -> "espacosingular". Retorna "" para apex / host
// desconhecido / slug reservado. Usado no server-side (ex.: preview Open Graph)
// onde nao ha o slug enviado pelo front.
const RESERVED = new Set([
  "www",
  "app",
  "api",
  "admin",
  "backend",
  "frontend",
  "static",
  "assets",
  "public"
]);

export const getSlugFromHost = (host?: string): string => {
  const h = (host || "").toLowerCase().split(":")[0].trim();
  if (!h) {
    return "";
  }

  const base = (
    process.env.APP_BASE_DOMAIN || (h.endsWith(".localhost") ? "localhost" : "")
  )
    .toLowerCase()
    .trim();
  if (!base || h === base || !h.endsWith(`.${base}`)) {
    return "";
  }

  const label = h.slice(0, h.length - base.length - 1).split(".")[0];
  if (!label || RESERVED.has(label) || !/^[a-z0-9-]+$/.test(label)) {
    return "";
  }

  return label;
};

export default getSlugFromHost;
