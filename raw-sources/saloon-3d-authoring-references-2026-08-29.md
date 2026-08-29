# Saloon 3D authoring references

Retrieved: 2026-08-29

This capture records the external tools considered after the procedural Saloon lab was judged too glossy, cold, and visually close to a product-photography cyclorama.

## threecn

Source: https://threecn.dev/

Repository: https://github.com/ln-dev7/threecn

Observed facts:

- threecn describes itself as "3D scenes for shadcn/ui. One command away."
- It distributes React Three Fiber and Drei scenes through the shadcn registry.
- A scene can be copied into a project with a command such as `shadcn add @threecn/particle-field`.
- Its theme hook reads shadcn CSS variables and maps them to Three.js colors.
- The observed catalog contains 27 scenes, mostly procedural effects, particles, product displays, typography, and abstract visualizations.
- The observed catalog does not contain a complete warm meeting-room interior.

What this changes:

- threecn is the closest literal match for a shadcn-style 3D source registry.
- It may supply an isolated effect or wrapper, but it does not remove the need to author or source the Saloon room itself.

## Triplex

Source: https://triplex.dev/

Documentation: https://triplex.dev/docs/get-started

Observed facts:

- Triplex is a visual workspace for React and React Three Fiber components.
- It exposes transforms and component props as visual controls.
- Editor changes can be saved back to source code, and source changes appear in the editor.
- Its documentation states support for existing React frameworks, including Next.js.
- Triplex is a development tool. It does not need to become a production runtime dependency for the Saloon.

What this changes:

- The team can tune composition, placement, scale, and light visually instead of editing every scene value blind in TSX.
- Triplex is the preferred dev-time editor for the current React Three Fiber scene.

## Poly Haven

Source: https://polyhaven.com/

License: https://polyhaven.com/license

Observed facts:

- Poly Haven provides HDRIs, textures, and 3D models.
- Poly Haven states that all assets on the site use the CC0 license.
- Its license permits commercial use, modification, and redistribution without required attribution.

What this changes:

- Poly Haven is the preferred source for locally stored wood, plaster, textile, stone, and environment assets.
- Every selected asset still needs a small local provenance note with its source URL and retrieval date.

## Drei environment helpers

Source: https://drei.docs.pmnd.rs/staging/environment

Observed facts:

- Drei's `Environment` helper can load local HDR, EXR, gainmap, or cubemap files.
- It exposes separate background and environment intensity and rotation controls.
- Its preset option relies on hosted assets and the docs warn that presets are not intended for production.
- `@pmndrs/assets` can self-host common environment assets through dynamic imports.

What this changes:

- The offline demo should continue loading a local environment asset.
- The rebuild should lower environment intensity and let one warm architectural key light define the room instead of relying on a bright studio environment.

## Spline

Community: https://community.spline.design/

GLTF/GLB export documentation: https://docs.spline.design/exporting-your-scene/files/exporting-as-gtlf-glb

Observed facts:

- Spline provides remixable community scenes and exports GLTF or GLB.
- Color-and-texture GLTF/GLB export is a paid feature.
- The documented GLTF/GLB export omits environment, lighting, fog, post-processing, events, interactivity, and several material features.

What this changes:

- Spline is acceptable for reference composition or a disposable prototype.
- It is not the preferred final authoring route for this Saloon because the export loses the properties that most affect warmth and material quality.

## Project decision

Use an asset-first Saloon shell inside the existing React Three Fiber canvas:

1. Keep the current custom agent orbs, selection state, camera modes, DOM labels, details, and findings UI.
2. Replace the procedural white room, table, and seats with one locally stored, textured room shell.
3. Use Triplex to tune placement and light in the existing Next.js project.
4. Use locally stored, license-recorded Poly Haven assets where they fit.
5. Keep Drei and React Three Fiber as the runtime. Do not add a second 3D runtime.
6. Treat threecn as an optional source for isolated effects only. Do not use a procedural threecn scene as the Saloon room.
7. Reserve gloss and cyan emission for agent state. The room uses matte plaster, wood, textile, and stone.
