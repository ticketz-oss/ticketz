# OneWorks gallery templates

`v2/` contains 161 original SVG gallery snapshots and the matching versioned
Avatar definitions from [OneWorks Avatar](https://github.com/oneworks-ai/avatar)
revision `a06ba84c123cf82e2b1a59c36b403392e22f9d08`. The snapshots are
copied unchanged. The definitions use the upstream preset and breed model with
the same seed as its gallery snapshots. They are rendered in the application by
the official OneWorks renderer shipped with `@oneworks/avatar-web@1.0.0-rc.9`
when an avatar is hovered or opened.

The license and copyright notice are in `LICENSE.oneworks.txt`. To regenerate:

```sh
python frontend/scripts/generate-oneworks-avatars.py
```

The script temporarily installs `@oneworks/avatar@1.0.0-rc.9` and
`esbuild@0.25.12` to export the definitions from the pinned source. Its
`v2/manifest.json` records SHA-256 hashes. The frontend loads only the selected
snapshot initially and lazy-loads its definition and the runtime on interaction.
