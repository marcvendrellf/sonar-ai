# Saloon baked-GI implementation references

Retrieved: 2026-08-29

This capture records the primary technical references used for the Saloon's static Cycles lightmap. External pages remain authoritative.

## Blender Cycles baking

Source: Blender Manual, "Render Baking"

- <https://docs.blender.org/manual/en/5.0/render/cycles/baking.html>
- <https://docs.blender.org/manual/en/4.5/render/cycles/baking.html>

Relevant points:

- Cycles bakes to the image selected in an active Image Texture node.
- A Diffuse bake can include Direct and Indirect lighting separately from Color.
- The Saloon enables Direct and Indirect and disables Color so the runtime clay material supplies albedo once.
- Bake margin extends texels beyond UV-island edges to prevent filtering seams.

Source: Blender Manual, "Supported Graphics Formats"

- <https://docs.blender.org/manual/en/5.0/files/media/image_formats.html>

Relevant point:

- OpenEXR supports half-float channel storage. The Saloon uses a 2,048 px, RGB, half-float EXR because the light field can exceed an 8-bit range.

## Three.js lightmaps and UV channels

Source: Three.js, `MeshStandardMaterial`

- <https://threejs.org/docs/pages/MeshStandardMaterial.html>

Relevant points:

- `lightMap` stores baked illumination and multiplies it into the material response.
- Lightmaps require a second UV set.
- HDR lightmaps use a linear color space.

Source: Three.js, `Texture.channel`

- <https://threejs.org/docs/pages/Texture.html#channel>

Relevant point:

- Texture channel `1` selects geometry attribute `uv1`. The Saloon's final GLB exports the authored `Lightmap` layer as `TEXCOORD_1`, and the runtime EXR sets `channel = 1`.

Source: Three.js example, `webgl_materials_lightmap`

- <https://threejs.org/examples/webgl_materials_lightmap.html>

Relevant point:

- The example demonstrates static baked lighting attached to a standard runtime material rather than recreated with dynamic room lights.

## Rejected browser path tracer

Source: `three-gpu-pathtracer`

- <https://github.com/gkjohnson/three-gpu-pathtracer>
- <https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/README.md>
- <https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/src/core/WebGLPathTracer.js>

Relevant points:

- The renderer accumulates progressive samples.
- Updating a moving camera resets accumulation.
- Sonar's table-to-interview camera moves and animated orbs would therefore prevent a stable first frame or repeatedly restart convergence.

Decision:

- Use Blender and Cycles only during asset generation.
- Ship one static GLB and one static EXR.
- Keep animated orbs in the existing React Three Fiber renderer.
- Do not add `three-gpu-pathtracer` or another runtime renderer.
