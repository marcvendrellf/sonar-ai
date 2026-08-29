# Saloon

The standalone Saloon feature is served at `/saloon`. The dashboard shell links
into it, while the 3D scene stays independent from the dashboard composition.

Written against `llm-wiki/interface-plan.md` §2 (single-table 3D Saloon) and
`llm-wiki/technical-reference-pack.md` §"Saloon 3D scene". The room follows the
clay-diorama direction in
`raw-sources/saloon-clay-style-decision-2026-08-29.md`; assets and licences are
recorded in `raw-sources/saloon-asset-provenance-2026-08-29.md`.

## What it does

One prepared event (EV-104, an export-control replay) runs from 09:42:04 to
09:43:12. Six agent orbs sit at one meeting table inside a cutaway clay room.
The default camera looks down into the diorama and keeps the whole gathering in
frame; selecting an orb moves the camera in over the rim to a frontal interview
view and opens that agent's details in DOM on the right.

## Files

| File | Owns |
| --- | --- |
| `run-fixture.ts` | The run: 20 typed trace entries, 3 sources, 4 deterministic checks, receipt SR-042, and the receipt-bound answers |
| `use-saloon-run.ts` | Playback. `cursor` is the number of events that have happened; every panel is a fold over that prefix |
| `saloon-scene.tsx` | The single React Three Fiber canvas: light rig, camera rig, evidence path, shell and orb composition |
| `saloon-shell.tsx` | `useGLTF` loader, the four clay materials bound by name, the loading and failure placeholder, and the asset error boundary |
| `../../scripts/build-saloon-shell.mjs` | Authors `public/models/saloon/saloon-shell.glb`. Run with `pnpm --filter web build:saloon-shell` |
| `agent-orb.tsx` | One orb: state-driven motion, ring shape, and DOM label |
| `saloon.tsx` | Composition, selection state, run controls, timeline scrubber |
| `agent-roster.tsx` | Keyboard-accessible roster that selects the same agents as the orbs |
| `agent-interview-panel.tsx` | Selected-agent details, grouped so source facts, model claims, and deterministic results stay distinct |
| `evidence-panel.tsx` | Relationship path, sources read, deterministic checks, receipt |
| `receipt-qa.tsx` | Questions answered from receipt SR-042 only |
| `saloon-sheets.tsx` | Source sheet and decision-receipt sheet |
| `saloon.css` | Agent, state, and result tokens, scoped to `.saloon-root` |

## Rules it holds to

- One canvas, one renderer, one animation loop. Every orb shares one geometry.
- The room is one local `.glb` of four merged meshes and four flat clay
  materials. No textures, no CDN, no second 3D runtime.
- One broad warm key, a weak fill, and one accumulated shadow baked over 60
  frames. Nothing in the room is emissive or reflective.
- The camera rig is the only owner of camera values.
- Selection lives outside the canvas and in `?agent=<id>`, so a demo view is reproducible.
- Text, evidence, and controls stay in DOM. Only the short orb labels sit over the canvas.
- State is carried by motion, height, ring shape, and a written label, never by colour alone.
- No raw Tailwind green or red. Every colour is a token in `saloon.css`.
- Reduced motion cuts between camera poses instead of flying, and stops the orb motion.
- A WebGL failure falls back to a seated roster that still selects agents.
- The run is fixture data. Nothing here places an order.

## Scrubbing

The timeline strip under the header is both a visualisation and a scrubber: one
tick per event, coloured by agent, taller for checkpoints and the risk gate.
Selecting a tick rebuilds the entire room at that moment, including agent states,
the relationship path, and which checks have run.
