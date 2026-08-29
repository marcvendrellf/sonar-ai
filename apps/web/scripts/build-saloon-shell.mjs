/**
 * Authors `public/models/saloon/saloon-shell.glb`: the static architecture and
 * furniture of the Saloon. Run it with `pnpm --filter web build:saloon-shell`.
 *
 * The target is the supplied clay diorama, not a real interior: a cutaway room
 * of a few large rounded forms, a dark chocolate table, and six seat plinths.
 * See `raw-sources/saloon-clay-style-decision-2026-08-29.md`.
 *
 * The shell owns geometry only. Colour, roughness and lighting are bound at
 * runtime in `features/saloon/saloon-shell.tsx` by material name. There are no
 * textures and no UVs: bevels, silhouette and soft light describe the forms.
 *
 * Everything is built in world space and merged by material, so the whole room
 * costs three draw calls.
 */

import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { LatheGeometry, Matrix4, Mesh, MeshStandardMaterial, Scene, Vector2 } from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"

/**
 * GLTFExporter reads its binary chunk back through FileReader, which Node does
 * not expose as a global. Blob.arrayBuffer covers everything the exporter uses.
 */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class NodeFileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer
        if (this.onloadend) this.onloadend()
      })
    }
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, "../public/models/saloon/saloon-shell.glb")

/**
 * The diorama. `inner` is the floor half-extent the camera rig clamps against;
 * the walls stand outside it. Keep in sync with ROOM in `saloon-shell.tsx`.
 */
const ROOM = {
  inner: 6.2,
  wall: 0.8,
  height: 2.4,
  frontHeight: 0.55,
  sideFrontHeight: 0.9,
  base: 0.6,
}
const OUTER = ROOM.inner + ROOM.wall

/**
 * The room is offset behind the table, so the cutaway rim sits close to the
 * near seats and the camera is not looking across an empty foreground.
 */
const ROOM_Z = -1.2

const SEAT_RADIUS = 2.55
const SEATS = 6

/** Table slab, and the height the orbs rest at. */
const TABLE_TOP = 0.98
const TABLE_BOTTOM = 0.6

const parts = []

function add(material, geometry, { x = 0, y = 0, z = 0 } = {}) {
  geometry.applyMatrix4(new Matrix4().makeTranslation(x, y, z))
  // Flat clay colours need no UVs, and dropping them keeps every merged
  // geometry attribute-compatible as well as smaller. Rounded boxes come back
  // non-indexed and lathes indexed, so everything is flattened before merging.
  geometry.deleteAttribute("uv")
  geometry.deleteAttribute("uv1")
  parts.push({ material, geometry: geometry.index ? geometry.toNonIndexed() : geometry })
}

/** A rounded box, the diorama's only wall and floor primitive. */
const slab = (w, h, d, radius = 0.35) => new RoundedBoxGeometry(w, h, d, 2, radius)

/**
 * A cylinder with both edges eased. Lathe profiles run bottom to top so the
 * generated normals face outward.
 */
function puck(radius, bottom, top, corner = 0.09, segments = 40) {
  const arc = (cx, cy, from, to, steps) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const angle = from + ((to - from) * i) / steps
      return new Vector2(cx + Math.cos(angle) * corner, cy + Math.sin(angle) * corner)
    })

  const points = [
    new Vector2(0, bottom),
    new Vector2(radius - corner, bottom),
    ...arc(radius - corner, bottom + corner, -Math.PI / 2, 0, 3),
    ...arc(radius - corner, top - corner, 0, Math.PI / 2, 3),
    new Vector2(0, top),
  ]

  return new LatheGeometry(points, segments)
}

// ---------------------------------------------------------------- architecture

// Base slab. Its top face is the floor, so the room sits on a visible plinth.
add("Floor", slab(OUTER * 2, ROOM.base, OUTER * 2, 0.45), { y: -ROOM.base / 2, z: ROOM_Z })

// Back wall, then side walls that step down towards the open front. The step is
// what makes the room read as a cutaway rather than a box.
add("Sand", slab(OUTER * 2, ROOM.height, ROOM.wall), {
  y: ROOM.height / 2,
  z: ROOM_Z - ROOM.inner - ROOM.wall / 2,
})

for (const side of [-1, 1]) {
  add("Sand", slab(ROOM.wall, ROOM.height, 7.2), {
    x: side * (ROOM.inner + ROOM.wall / 2),
    y: ROOM.height / 2,
    z: ROOM_Z - 2.6,
  })
  add("Sand", slab(ROOM.wall, ROOM.sideFrontHeight, 5.2, 0.3), {
    x: side * (ROOM.inner + ROOM.wall / 2),
    y: ROOM.sideFrontHeight / 2,
    z: ROOM_Z + 3.6,
  })
}

// Low front rim: the cutaway edge the camera looks over.
add("Sand", slab(OUTER * 2, ROOM.frontHeight, ROOM.wall, 0.26), {
  y: ROOM.frontHeight / 2,
  z: ROOM_Z + ROOM.inner + ROOM.wall / 2,
})

// One niche and one slot, set almost flush into the wall faces. They give the
// room a silhouette without becoming decoration.
add("Plinth", slab(1.8, 1.5, 0.5, 0.2), { x: -3.4, y: 1.05, z: ROOM_Z - ROOM.inner - 0.22 })
add("Sand", slab(1.62, 0.14, 0.34, 0.06), { x: -3.4, y: 0.37, z: ROOM_Z - ROOM.inner + 0.1 })
add("Plinth", slab(0.5, 1.7, 0.45, 0.2), { x: ROOM.inner + 0.22, y: 1.35, z: ROOM_Z - 3.4 })

// ------------------------------------------------------------------- furniture

// One dark slab with a scalloped edge, lifted off the floor on plinths, exactly
// as in the supplied reference.
add("Table", puck(2.0, TABLE_BOTTOM, TABLE_TOP, 0.1, 64))
add("Plinth", puck(0.85, 0, TABLE_BOTTOM + 0.02, 0.08, 40))

for (let seat = 0; seat < SEATS; seat += 1) {
  const angle = (seat / SEATS) * Math.PI * 2 - Math.PI / 2
  const x = Math.cos(angle) * SEAT_RADIUS
  const z = Math.sin(angle) * SEAT_RADIUS
  add("Table", puck(0.62, TABLE_BOTTOM, TABLE_TOP, 0.1, 36), { x, z })
  add("Plinth", puck(0.5, 0, TABLE_BOTTOM + 0.02, 0.07, 28), { x, z })
}

// ------------------------------------------------------------------ merge/write

/** Preview colours only. `saloon-shell.tsx` owns the shipped material values. */
const colours = {
  Sand: 0xc3a482,
  Floor: 0xb99a74,
  Table: 0x6b5340,
  Plinth: 0x574334,
}

const scene = new Scene()
scene.name = "SaloonShell"

let triangles = 0
for (const name of Object.keys(colours)) {
  const geometries = parts.filter((part) => part.material === name).map((part) => part.geometry)
  if (geometries.length === 0) continue

  const flat = mergeGeometries(geometries)
  if (!flat) throw new Error(`Could not merge geometry for material ${name}`)
  // Welding after the merge indexes the whole mesh without softening the hard
  // edges: mergeVertices only joins vertices whose normals already match.
  const merged = mergeVertices(flat)
  merged.computeBoundingSphere()
  triangles += (merged.index ? merged.index.count : merged.attributes.position.count) / 3

  const mesh = new Mesh(
    merged,
    new MeshStandardMaterial({ name, color: colours[name], roughness: 0.95, metalness: 0 })
  )
  mesh.name = name
  scene.add(mesh)
}

const exporter = new GLTFExporter()
const glb = await exporter.parseAsync(scene, { binary: true })
writeFileSync(OUT, Buffer.from(glb))

console.log(
  `saloon-shell.glb: ${scene.children.length} meshes, ${triangles} triangles, ${(
    glb.byteLength / 1024
  ).toFixed(0)} kB`
)
