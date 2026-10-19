// Isolated, loopback-only preview of production login components. No API proxy.
const path = require("path");
const fs = require("fs");
const http = require("http");
const os = require("os");
const webpack = require("webpack");
process.env.BABEL_ENV = "development";
const output = fs.mkdtempSync(path.join(os.tmpdir(), "ticketz-login-preview-"));
const base = path.resolve(__dirname, "../..");
const publicRoot = path.join(base, "public");
const mime = {
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};
const compiler = webpack({
  mode: "development",
  devtool: false,
  context: base,
  entry: path.join(__dirname, "index.js"),
  output: { path: output, filename: "preview.js", publicPath: "/" },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": path.join(base, "src"),
      "../services/config": path.join(__dirname, "config.js"),
      "../../services/config": path.join(__dirname, "config.js"),
      "../../context/Auth/AuthContext": path.join(__dirname, "fixtures.js"),
      "../../hooks/useSettings": path.join(__dirname, "fixtures.js"),
      "../../services/api": path.join(__dirname, "api.js")
    }
  },
  module: {
    rules: [
      { test: /\.m?js$/, resolve: { fullySpecified: false } },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve("babel-loader"),
          options: { presets: [require.resolve("babel-preset-react-app")] }
        }
      },
      { test: /\.(png|jpe?g|gif|svg|woff2?)$/i, type: "asset/resource" },
      {
        test: /\.css$/,
        use: [
          require.resolve("style-loader"),
          require.resolve("css-loader"),
          {
            loader: require.resolve("postcss-loader"),
            options: {
              postcssOptions: {
                plugins: [
                  require("tailwindcss")({
                    config: path.join(base, "tailwind.config.js")
                  })
                ]
              }
            }
          }
        ]
      }
    ]
  }
});

let server;
compiler.watch({}, (error, stats) => {
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({ all: false, errors: true }));
    return;
  }
  if (server) {
    console.log("Login preview rebuilt; reload the browser.");
    return;
  }
  server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; media-src 'self' blob:"
    );
    const pathname = new URL(req.url, "http://127.0.0.1:4319").pathname;
    if (pathname === "/mobile" || pathname === "/mobile-small") {
      const width = pathname === "/mobile-small" ? 320 : 390;
      const height = pathname === "/mobile-small" ? 740 : 844;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(
        `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login real · QA mobile ${width}px</title><style>html,body{margin:0;min-height:100%;background:#e4e4e7}body{padding:24px;box-sizing:border-box;display:flex;justify-content:center}iframe{display:block;flex:none;border:0;background:white;box-shadow:0 8px 30px #0002}</style></head><body><iframe src="/" title="Login real em viewport ${width} por ${height}" width="${width}" height="${height}"></iframe></body></html>`
      );
    }
    let filename;
    if (pathname.startsWith("/branding/")) {
      filename = path.join(publicRoot, "branding", path.basename(pathname));
    } else if (pathname.startsWith("/backend/")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "External APIs are disabled in this preview" })
      );
    } else if (pathname !== "/" && pathname !== "/settings") {
      filename = path.join(output, path.basename(pathname));
    }
    if (filename) {
      if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        mime[path.extname(filename)] || "application/octet-stream"
      );
      return fs.createReadStream(filename).pipe(res);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login real · QA local</title></head><body><div id="root"></div><script src="/preview.js"></script></body></html>'
    );
  });
  server.listen(4319, "127.0.0.1", () =>
    console.log(
      "Login preview ready: http://127.0.0.1:4319/ · Settings: /settings"
    )
  );
});
