"""Copy the official OneWorks gallery and export its runtime definitions.

Requires Python 3.12, Node.js and npm. The upstream source and build tools are
used only for catalog generation. The frontend uses @oneworks/avatar-web.
"""

import hashlib
import io
import json
import os
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path


REVISION = "a06ba84c123cf82e2b1a59c36b403392e22f9d08"
AVATAR_VERSION = "1.0.0-rc.9"
ESBUILD_VERSION = "0.25.12"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "avatars" / "oneworks" / "v2"
ARCHIVE_URL = f"https://github.com/oneworks-ai/avatar/archive/{REVISION}.zip"


def main():
    request = urllib.request.Request(ARCHIVE_URL, headers={"User-Agent": "ticketz-avatar-generator"})
    with urllib.request.urlopen(request, timeout=120) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))

    with tempfile.TemporaryDirectory(prefix="ticketz-oneworks-") as temporary:
        source = Path(temporary)
        for name in archive.namelist():
            if "/src/" not in name or not name.endswith((".ts", ".tsx", ".json", ".svg")):
                continue
            relative = Path(name.split("/src/", 1)[1])
            if ".." in relative.parts:
                raise RuntimeError(f"Unsafe upstream path: {name}")
            path = source / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(archive.read(name))

        shutil.copy2(Path(__file__).with_name("oneworks-catalog-extract.ts"), source)
        npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
        subprocess.run(
            [npm, "install", "--prefix", str(source), "--no-save",
             f"@oneworks/avatar@{AVATAR_VERSION}", f"esbuild@{ESBUILD_VERSION}"],
            check=True,
        )
        build = (
            "const e=require(process.argv[1]);"
            "e.buildSync({entryPoints:[process.argv[2]],bundle:true,platform:'node',"
            "format:'cjs',outfile:process.argv[3],packages:'external'})"
        )
        subprocess.run(
            ["node", "-e", build, str(source / "node_modules" / "esbuild"),
             str(source / "oneworks-catalog-extract.ts"), str(source / "extract.cjs")],
            check=True,
        )
        generated = source / "generated"
        subprocess.run(["node", str(source / "extract.cjs"), str(generated)], check=True)

        templates = json.loads((generated / "templates.json").read_text(encoding="utf-8"))
        if len(templates) < 150 or len(templates) != len(set(templates)):
            raise RuntimeError("Unexpected OneWorks template catalog")
        OUTPUT.mkdir(parents=True, exist_ok=True)
        entries = []
        for slug in templates:
            files = []
            for suffix in ("svg", "json"):
                name = f"{slug}.{suffix}"
                target = OUTPUT / name
                shutil.copy2(generated / name, target)
                files.append({"file": name, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
            entries.append({"slug": slug, "files": files})

    (ROOT / "src" / "helpers" / "oneworksTemplates.json").write_text(
        json.dumps(templates, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "manifest.json").write_text(
        json.dumps({
            "source": "https://github.com/oneworks-ai/avatar",
            "revision": REVISION,
            "runtime": f"@oneworks/avatar-web@{AVATAR_VERSION}",
            "license": "MIT",
            "count": len(templates),
            "entries": entries,
        }, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    license_path = next(name for name in archive.namelist() if name.endswith("/LICENSE"))
    license_target = OUTPUT.parent / "LICENSE.oneworks.txt"
    license_bytes = archive.read(license_path)
    if not license_target.exists() or license_target.read_bytes() != license_bytes:
        license_target.write_bytes(license_bytes)
    print(f"Generated {len(templates)} official OneWorks templates in {OUTPUT}")


if __name__ == "__main__":
    main()
