# Saloon clay-style visual decision

Date: 2026-08-29

Source: user feedback and [user-supplied clay-style reference](assets/saloon-clay-style-reference-2026-08-29.png)

## User feedback

The Saloon should follow the supplied stylized diorama direction. The lighting is very soft, with broad, blurred shadows. The current Saloon is too glossy, its light treatment is poor, and realistic textures make the result worse rather than better.

## Decision

- Render the Saloon as a compact, cutaway video-game diorama.
- Use simple rounded geometry and a restrained clay-like material palette.
- Prefer flat or low-frequency color variation over photographic texture maps.
- Use matte materials with high roughness and zero metalness for the room, table, and seats.
- Keep the agent orbs slightly smoother than the room, but do not make them glass or chrome.
- Use broad, soft illumination with low-contrast fill and diffuse contact shadows.
- Avoid hard point-light highlights, bright studio environment reflections, detailed wood grain, fabric weave, stone veining, photoreal normal maps, and luxury-interior styling.
- Keep one dark brown table, warm sand architecture, simple seat plinths, six orbs, and a restrained cyan evidence path.
- Frame the default scene like a game diorama with a slightly elevated three-quarter camera and a visible cutaway room boundary.

## What this changes

The earlier warm asset-first plan remains useful for composing one local room shell, but realistic PBR asset packs are no longer the target. Geometry, silhouette, bevels, color blocks, and soft baked-style light now carry the room. Poly Haven may supply a subdued local environment if needed, but realistic material textures should not define the look.
