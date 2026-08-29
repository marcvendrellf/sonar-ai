/**
 * Authors `.saloon-build/saloon-shell-geometry.glb`: the geometry-only input
 * for the Cycles bake. Run the complete pipeline with
 * `pnpm --filter web build:saloon-shell`.
 *
 * The accepted scene is a dark open floor with no room shell: one broad ground,
 * a dark clay table, and six U-shaped chairs facing it.
 *
 * This step owns geometry only. Blender creates the base and lightmap UV sets,
 * bakes the static illumination, and exports the shipped GLB and EXR. Preview
 * colours keep the four material identities intact between the two steps.
 *
 * Everything is built in world space and merged by material, so the complete
 * static scene costs four draw calls.
 */

import { mkdirSync, writeFileSync } from "node:fs"
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
const OUT = resolve(here, "../.saloon-build/saloon-shell-geometry.glb")

/** Open floor dimensions. Keep `inner` in sync with ROOM in `saloon-shell.tsx`. */
const ROOM = {
  inner: 14,
  topDepth: 0.26,
  baseDepth: 0.18,
}

const CHAIR_RADIUS = 3.15
const SEATS = 6

/** Table slab and the shared height of every U-shaped chair rail. */
const TABLE_TOP = 0.98
const TABLE_BOTTOM = 0.38
const CHAIR_BOTTOM = 0.08
const CHAIR_TOP = 0.88

const parts = []

function add(material, geometry, { x = 0, y = 0, z = 0, rotationY = 0 } = {}) {
  geometry.applyMatrix4(new Matrix4().makeRotationY(rotationY))
  geometry.applyMatrix4(new Matrix4().makeTranslation(x, y, z))
  // Blender authors both UV sets after import. Dropping source UVs keeps every
  // merged geometry attribute-compatible. Rounded boxes come back non-indexed
  // and lathes indexed, so everything is flattened before merging.
  geometry.deleteAttribute("uv")
  geometry.deleteAttribute("uv1")
  parts.push({ material, geometry: geometry.index ? geometry.toNonIndexed() : geometry })
}

/** A rounded box for the floor, chair rails, and compact geometry. */
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

// ---------------------------------------------------------------------- floor

// A broad top surface and a shallow lower slab are the only environment. The
// camera never enters a room and no wall can create a bright patch behind an orb.
add("Floor", slab(ROOM.inner * 2, ROOM.topDepth, ROOM.inner * 2, 0.5), {
  y: -ROOM.topDepth / 2,
})
add("Sand", slab(ROOM.inner * 2 + 0.5, ROOM.baseDepth, ROOM.inner * 2 + 0.5, 0.58), {
  y: -ROOM.topDepth - ROOM.baseDepth / 2,
})

// ------------------------------------------------------------------- furniture

// One deep, dark-cream slab with a scalloped edge and a floor-reaching base.
add("Table", puck(2.0, TABLE_BOTTOM, TABLE_TOP, 0.1, 64))
add("Plinth", puck(1.45, 0, TABLE_BOTTOM + 0.02, 0.08, 48))

for (let seat = 0; seat < SEATS; seat += 1) {
  const angle = (seat / SEATS) * Math.PI * 2 - Math.PI / 2
  const x = Math.cos(angle) * CHAIR_RADIUS
  const z = Math.sin(angle) * CHAIR_RADIUS
  const rotationY = Math.PI / 2 - angle
  const height = CHAIR_TOP - CHAIR_BOTTOM
  const y = CHAIR_BOTTOM + height / 2

  // One open U per agent: equal-height back and arms, with the opening facing
  // the table. There is no pedestal or circular seat, so the silhouette cannot
  // read as a mushroom from the overview camera.
  add("Plinth", slab(1.5, height, 0.28, 0.1), { x, y, z, rotationY })
  for (const side of [-1, 1]) {
    const localX = side * 0.61
    const localZ = -0.52
    const worldX = x + Math.cos(rotationY) * localX + Math.sin(rotationY) * localZ
    const worldZ = z - Math.sin(rotationY) * localX + Math.cos(rotationY) * localZ
    add("Plinth", slab(0.28, height, 0.78, 0.1), {
      x: worldX,
      y,
      z: worldZ,
      rotationY,
    })
  }
}

// ------------------------------------------------------------------ merge/write

/** Preview colours only. `saloon-shell.tsx` owns the shipped material values. */
const colours = {
  Sand: 0x0d0f12,
  Floor: 0x17191d,
  Table: 0x403832,
  Plinth: 0x2d2928,
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
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, Buffer.from(glb))

console.log(
  `saloon-shell-geometry.glb: ${scene.children.length} meshes, ${triangles} triangles, ${(
    glb.byteLength / 1024
  ).toFixed(0)} kB`
)
