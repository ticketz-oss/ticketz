import { Request, Response } from "express";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";
import getSlugFromHost from "../helpers/getSlugFromHost";

// Escapa texto para uso seguro dentro de atributos HTML.
const esc = (value: string): string =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Gera um HTML enxuto com as meta tags Open Graph / Twitter da empresa do
// subdominio. Servido para crawlers de link (WhatsApp, Telegram, etc.), que
// nao executam JS. Cada tenant tem seu proprio banner (linkPreviewImage),
// titulo (appName) e descricao (linkPreviewDescription).
export const show = async (req: Request, res: Response): Promise<Response> => {
  const host = String(req.headers.host || "");
  // Em producao (Railway) o TLS termina no edge e o container recebe http, por
  // isso nao da' pra confiar no $scheme repassado. Os dominios de tenant sao
  // sempre https; so' localhost usa http.
  const hostname = host.toLowerCase().split(":")[0];
  const isLocal =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.startsWith("127.");
  const proto = isLocal ? "http" : "https";
  const originalUri = String(req.headers["x-original-uri"] || "/");
  const base = `${proto}://${host}`;
  const slug = getSlugFromHost(host);

  const read = async (key: string): Promise<string> => {
    try {
      const value = await GetPublicSettingService({
        key,
        slug: slug || undefined
      });
      return typeof value === "string" ? value : "";
    } catch {
      return "";
    }
  };

  const [appName, previewImage, previewDescription, logoLight] =
    await Promise.all([
      read("appName"),
      read("linkPreviewImage"),
      read("linkPreviewDescription"),
      read("appLogoLight")
    ]);

  const title = appName || "Espaço Whats";
  const description = previewDescription || appName || "";
  const imageFile = previewImage || logoLight || "";
  const imageUrl = imageFile
    ? `${base}/backend/public/${imageFile}?inline=1`
    : "";
  const pageUrl = `${base}${originalUri}`;

  const tags = [
    `<meta charset="utf-8"/>`,
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>`,
    `<title>${esc(title)}</title>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${esc(title)}"/>`,
    `<meta property="og:title" content="${esc(title)}"/>`,
    description
      ? `<meta property="og:description" content="${esc(description)}"/>`
      : "",
    `<meta property="og:url" content="${esc(pageUrl)}"/>`,
    imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}"/>` : "",
    imageUrl
      ? `<meta property="og:image:secure_url" content="${esc(imageUrl)}"/>`
      : "",
    imageUrl ? `<meta property="og:image:alt" content="${esc(title)}"/>` : "",
    `<meta name="twitter:card" content="${
      imageUrl ? "summary_large_image" : "summary"
    }"/>`,
    `<meta name="twitter:title" content="${esc(title)}"/>`,
    description
      ? `<meta name="twitter:description" content="${esc(description)}"/>`
      : "",
    imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}"/>` : ""
  ]
    .filter(Boolean)
    .join("\n    ");

  const html = `<!doctype html>
<html prefix="og: https://ogp.me/ns#">
  <head>
    ${tags}
  </head>
  <body></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).send(html);
};

export default { show };
