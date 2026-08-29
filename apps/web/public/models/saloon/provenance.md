# Saloon runtime assets

Full record, including licences, authors, retrieval dates, withdrawn assets, and
rejected alternatives: `raw-sources/saloon-asset-provenance-2026-08-29.md`.

| File | Source | Licence |
| --- | --- | --- |
| `models/saloon/saloon-shell.glb` | Original, built by `apps/web/scripts/build-saloon-shell.mjs` | Repository work |
| `environments/saloon/warm_restaurant_night_1k.hdr` | <https://polyhaven.com/a/warm_restaurant_night> | CC0 |

These two files are everything the Saloon loads at runtime, and both load from
the application origin. Nothing in the Saloon requests a CDN, a Spline scene, or
a Drei environment preset.
