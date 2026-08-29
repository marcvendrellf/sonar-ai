# Saloon

The standalone Saloon feature is served at `/saloon`. The dashboard shell links
into it, while the 3D scene stays independent from the dashboard composition.

Written against `llm-wiki/interface-plan.md` §2 (single-table 3D Saloon) and
`llm-wiki/technical-reference-pack.md` §"Saloon 3D scene". The scene began from
the clay-diorama direction in
`raw-sources/saloon-clay-style-decision-2026-08-29.md`; the later user-directed
open-floor and sunset-lighting refinement is recorded in `llm-wiki/log.md`.
Assets and licences are recorded in
`raw-sources/saloon-asset-provenance-2026-08-29.md`.

## What it does

One prepared event (EV-104, an export-control replay) runs from 09:42:04 to
09:43:12. Six agent orbs sit at one meeting table on an open creamy clay floor.
The default camera looks down on the gathering; selecting an orb moves the
camera into an interview view and opens that agent's completed work in DOM on
the right.

## Files

| File | Owns |
| --- | --- |
| `run-fixture.ts` | The run: 20 typed trace entries, 3 sources, 4 deterministic checks, receipt SR-042, and the receipt-bound answers |
| `use-saloon-run.ts` | Playback. `cursor` is the number of events that have happened; every panel is a fold over that prefix |
| `saloon-scene.tsx` | The single React Three Fiber canvas: camera rig, warm shadow-casting light, open-floor extension, and orb composition |
| `saloon-shell.tsx` | GLB and EXR loaders, UV validation, four clay materials, loading and failure placeholder, and asset error boundary |
| `../../scripts/build-saloon-shell.mjs` | Authors the ignored geometry-only intermediate |
| `../../scripts/bake-saloon-lightmap.py` | Creates both UV sets, runs the Cycles bake, and exports the shipped GLB and EXR. Run the full pair with `pnpm --filter web build:saloon-shell` |
| `agent-orb.tsx` | One naturally lit orb with eased hover scale and selected-only float |
| `saloon.tsx` | Composition, automatic fixture playback, and selection state |
| `agent-roster.tsx` | Keyboard-accessible roster that selects the same agents as the orbs |
| `agent-interview-panel.tsx` | Selected-agent details, grouped so source facts, model claims, and deterministic results stay distinct |
| `evidence-panel.tsx` | Retained relationship-path component; not mounted in the simplified table view |
| `receipt-qa.tsx` | Retained receipt Q&A component; not mounted in the simplified table view |
| `saloon-sheets.tsx` | Source and receipt sheets; the selected-agent source sheet remains mounted |
| `saloon.css` | Agent, state, and result tokens, scoped to `.saloon-root` |

## Rules it holds to

- One canvas, one renderer, one animation loop. Every orb shares one geometry.
- The local `.glb` contains one broad floor, its shallow base, the table, and
  the plinths as four merged matte-clay meshes. There are no walls, niches, or
  other room geometry, and no photographic textures, CDN, or second runtime.
- Blender 5.2.1 LTS and Cycles bake a 3,400 K overhead area source, low warm
  World fill at strength 0.22, direct diffuse light, indirect bounce, and static
  contacts into the EXR.
- One warm shadow-casting runtime directional light and restrained hemisphere
  bounce illuminate the room materials and orbs together. VSM filtering keeps
  the real-time orb, seat, table, and floor shadows soft without convergence.
- The four static meshes have `uv` and `uv1`. The cached EXR uses texture channel
  1 on the table and plinth materials; the floor uses runtime light directly to
  avoid a visible baked-light boundary in interview views.
- Only the selected orb floats. Hover scale and selected motion use damped
  interpolation; unselected orbs do not bob, lift, or spin. No fake radial
  shadow cards or state rings remain.
- The table has no WebGL evidence graph. The default right panel is limited to
  the agent roster and each agent's completed work; there is no timeline.
- The deep dark-cream table slab and broad center base extend to the floor. The
  overview camera gives the table and six agents priority over the open,
  unsaturated creamy ground.
- The camera rig is the only owner of camera values.
- Selection lives outside the canvas and in `?agent=<id>`, so a demo view is reproducible.
- Text and evidence stay in DOM. No name or state label is rendered beneath an
  orb; the roster and selected-agent panel retain accessible identity and status.
- The top scene header, timeline controls, and bottom canvas instruction were
  removed so the table and agents stay primary. Fixture playback remains automatic.
- State is written in the accessible DOM roster and selected-agent panel, never
  communicated by orb colour alone.
- No raw Tailwind green or red. Every colour is a token in `saloon.css`.
- Reduced motion cuts between camera poses instead of flying and disables the
  selected-orb float.
- A WebGL failure falls back to a seated roster that still selects agents.
- The run is fixture data. Nothing here places an order.
