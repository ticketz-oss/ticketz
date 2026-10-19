const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../public");

for (const route of ["privacidade", "termos"]) {
  test(`${route}: documento público completo e independente de JavaScript`, () => {
    const html = fs.readFileSync(path.join(root, route, "index.html"), "utf8");
    assert.match(html, /<html lang="pt-BR">/);
    assert.match(html, /61\.824\.588\/0001-92/);
    assert.match(html, /mailto:contato@somosespaco\.com\.br/);
    assert.match(html, new RegExp(`https://espacowhats\\.com\\.br/${route}/`));
    assert.match(html, /href="https:\/\/github\.com\/GuiZeroUm\/ticketz"/);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.doesNotMatch(
      html,
      /<script\b|GOCSPX-|sk_live_|pk_live_|TODO|Lorem ipsum/
    );
    for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
      if (href === "/" || href === "/login") continue;
      const target = path.join(
        root,
        href,
        href.endsWith("/") ? "index.html" : ""
      );
      assert.ok(fs.existsSync(target), `Destino interno existente: ${href}`);
    }
  });
}

test("privacidade explica autorização, exclusão e limite de escopos Google", () => {
  const html = fs.readFileSync(
    path.join(root, "privacidade/index.html"),
    "utf8"
  );
  for (const term of [
    "tenant",
    "e-mail verificado",
    "openid",
    "Gmail",
    "Google Drive",
    "exclusão",
    "myaccount.google.com/connections",
    "Clerk",
    "transferência internacional"
  ]) {
    assert.ok(
      html.replace(/\s+/g, " ").includes(term),
      `Informação presente: ${term}`
    );
  }
});

test("estilo acessível em claro, escuro e impressão, sem importações remotas", () => {
  const css = fs.readFileSync(path.join(root, "legal/legal.css"), "utf8");
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /focus-visible/);
  assert.match(css, /@media print/);
  assert.doesNotMatch(css, /@import|url\(/);
});
