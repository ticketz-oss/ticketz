// Isolated component preview: no production database, cookies or API access.
const path = require("path");
const fs = require("fs");
const http = require("http");
const os = require("os");
const webpack = require("webpack");
process.env.BABEL_ENV = "development";
const output = fs.mkdtempSync(path.join(os.tmpdir(), "ticketz-chat-preview-"));
const base = path.resolve(__dirname, "../..");
webpack(
  {
    mode: "development",
    devtool: false,
    context: base,
    entry: path.join(
      __dirname,
      process.env.QA_TICKETS ? "index.js" : "real-media.js"
    ),
    output: { path: output, filename: "preview.js", publicPath: "/" },
    resolve: {
      extensions: [".js"],
      alias: {
        "../services/config": path.join(__dirname, "config.js"),
        "../../services/config": path.join(__dirname, "config.js"),
        "../../context/Auth/AuthContext": path.join(__dirname, "contexts.js"),
        "../../context/Tickets/TicketsContext": path.join(
          __dirname,
          "contexts.js"
        ),
        "../../services/api": path.join(__dirname, "api.js"),
        "../TicketMessagesDialog": path.join(__dirname, "dialog.js")
      }
    },
    module: {
      rules: [
        { test: /\.m?js$/, resolve: { fullySpecified: false } },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve("babel-loader"),
            options: { presets: [require.resolve("babel-preset-react-app")] }
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg|mp3|ogg)$/i,
          type: "asset/resource"
        },
        {
          test: /\.css$/,
          use: [require.resolve("style-loader"), require.resolve("css-loader")]
        }
      ]
    }
  },
  (error, stats) => {
    if (error || stats.hasErrors()) {
      console.error(error || stats.toString({ all: false, errors: true }));
      process.exit(1);
    }
    http
      .createServer((req, res) => {
        if (req.url === "/sample.wav") {
          const rate = 8000,
            frames = rate * 4,
            buffer = Buffer.alloc(44 + frames * 2);
          buffer.write("RIFF");
          buffer.writeUInt32LE(36 + frames * 2, 4);
          buffer.write("WAVEfmt ", 8);
          buffer.writeUInt32LE(16, 16);
          buffer.writeUInt16LE(1, 20);
          buffer.writeUInt16LE(1, 22);
          buffer.writeUInt32LE(rate, 24);
          buffer.writeUInt32LE(rate * 2, 28);
          buffer.writeUInt16LE(2, 32);
          buffer.writeUInt16LE(16, 34);
          buffer.write("data", 36);
          buffer.writeUInt32LE(frames * 2, 40);
          for (let n = 0; n < frames; n++)
            buffer.writeInt16LE(
              Math.round(
                Math.sin((n * 2 * Math.PI * 220) / rate) *
                  1200 *
                  (0.5 + 0.5 * Math.sin((n / rate) * 6))
              ),
              44 + n * 2
            );
          res.writeHead(200, {
            "Content-Type": "audio/wav",
            "Content-Length": buffer.length
          });
          return res.end(buffer);
        }
        const filename = path.join(
          output,
          path.basename(req.url.split("?")[0])
        );
        if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
          res.setHeader("Content-Type", "application/javascript");
          return fs.createReadStream(filename).pipe(res);
        }
        res.setHeader("Content-Type", "text/html");
        res.end(
          '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chat QA local</title><div id="root"></div><script src="/preview.js"></script></html>'
        );
      })
      .listen(4318, "127.0.0.1", () =>
        console.log("Preview ready: http://127.0.0.1:4318")
      );
  }
);
