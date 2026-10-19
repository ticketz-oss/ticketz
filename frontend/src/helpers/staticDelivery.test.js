import fs from "fs";
import os from "os";
import path from "path";
import { gunzipSync } from "zlib";

const { precompress } = require("../../scripts/precompress.cjs");
let temporary;
beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), "ticketz-static-test-"));
});
afterEach(() => fs.rmSync(temporary, { recursive: true, force: true }));

test("precompresses static text losslessly and preserves original files and mtimes", async () => {
  fs.mkdirSync(path.join(temporary, "js"));
  const filename = path.join(temporary, "js/main.abc123.js");
  const source = "console.log('static bundle');\n".repeat(300);
  fs.writeFileSync(filename, source);
  fs.utimesSync(filename, 1700000000, 1700000000);
  const stats = await precompress(temporary);
  const first = fs.readFileSync(`${filename}.gz`);
  expect(gunzipSync(first).toString()).toBe(source);
  expect(fs.readFileSync(filename, "utf8")).toBe(source);
  expect(fs.statSync(`${filename}.gz`).mtimeMs).toBe(
    fs.statSync(filename).mtimeMs
  );
  expect(stats.files).toBe(1);
  expect(stats.compressedBytes).toBeLessThan(stats.originalBytes);
  await precompress(temporary);
  expect(fs.readFileSync(`${filename}.gz`)).toEqual(first);
});

test("skips runtime JSON, images, maps, small files and symlinks", async () => {
  for (const name of ["config.json", "logo.png", "main.js.map"]) {
    fs.writeFileSync(path.join(temporary, name), "x".repeat(2000));
  }
  fs.writeFileSync(path.join(temporary, "small.js"), "x");
  fs.symlinkSync(
    path.join(temporary, "config.json"),
    path.join(temporary, "link.js")
  );
  expect((await precompress(temporary)).files).toBe(0);
  expect(fs.readdirSync(temporary).some(name => name.endsWith(".gz"))).toBe(
    false
  );
});

test("removes the splash immediately after mounting instead of waiting for its progress timer", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../../public/index.html"),
    "utf8"
  );
  const source = html.match(
    /window\.finishProgress = \(\) => \{([\s\S]*?)\n      \};/
  )[1];
  const clear = jest.fn();
  const progressBar = { style: {} };
  document.body.innerHTML =
    '<div id="splash-background"></div><div id="root">App</div>';
  const finish = new Function(
    "document",
    "clearInterval",
    "interval",
    "progressBar",
    "progress",
    source
  );
  finish(document, clear, 42, progressBar, 0);
  expect(clear).toHaveBeenCalledWith(42);
  expect(document.getElementById("splash-background")).toBeNull();
  expect(document.getElementById("root").textContent).toBe("App");
  expect(progressBar.style.width).toBe("100%");
  expect(() => finish(document, clear, 42, progressBar, 0)).not.toThrow();
});
