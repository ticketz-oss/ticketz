const path = require("path");
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: [path.join(__dirname, "kirby-entry.js")],
  outfile: path.join(__dirname, "../public/agent-preview/kirby.bundle.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  legalComments: "linked"
});
console.log("Official Avatar Lab renderer bundled for Espaço Whats.");
