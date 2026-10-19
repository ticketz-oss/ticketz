const fs = require("node:fs/promises");
const path = require("node:path");
const { gzipSync } = require("node:zlib");

// Build artifacts only: never compress runtime config, API responses or uploads.
async function precompress(directory) {
  let files = 0;
  let originalBytes = 0;
  let compressedBytes = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await precompress(filename);
      files += nested.files;
      originalBytes += nested.originalBytes;
      compressedBytes += nested.compressedBytes;
    } else if (entry.isFile() && /\.(js|css|svg)$/.test(entry.name)) {
      const content = await fs.readFile(filename);
      if (content.length < 1024) continue;
      const compressed = gzipSync(content, { level: 9 });
      if (compressed.length >= content.length) continue;
      const stat = await fs.stat(filename);
      await fs.writeFile(`${filename}.gz`, compressed);
      await fs.utimes(`${filename}.gz`, stat.atime, stat.mtime);
      files += 1;
      originalBytes += content.length;
      compressedBytes += compressed.length;
    }
  }
  return { files, originalBytes, compressedBytes };
}

if (require.main === module) {
  precompress(path.resolve(__dirname, "../build/static"))
    .then(result => console.log("Precompressed static assets:", result))
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { precompress };
