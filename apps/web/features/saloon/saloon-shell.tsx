"use client"

import * as React from "react"
import { useGLTF } from "@react-three/drei"
import { MeshStandardMaterial, type Mesh } from "three"

/**
 * The static Saloon: a cutaway clay diorama, authored by
 * `scripts/build-saloon-shell.mjs` and stored locally. Nothing here is
 * interactive. The six agent orbs, their hit areas and the camera stay in
 * React, so this file only loads geometry and binds materials to it.
 *
 * The shell carries no textures. Per the clay-style decision in
 * `raw-sources/saloon-clay-style-decision-2026-08-29.md`, bevels, silhouette
 * and broad soft light describe the forms; photographic wood grain, fabric
 * weave and stone veining are deliberately absent.
 */

const MODEL = "/models/saloon/saloon-shell.glb"

/** Room dimensions baked into the shell. The camera rig clamps against these. */
export const ROOM = {
  /** Floor half-extent. The walls stand outside it. */
  inner: 6.2,
  height: 2.4,
  /** The room is offset behind the table so the cutaway rim sits near the seats. */
  centreZ: -1.2,
} as const

/** Top surface of the table slab, set in the authoring script. */
export const TABLE_SURFACE_Y = 0.98

/** Merged mesh per material. Four draw calls for the whole room. */
const SLOTS = ["Floor", "Sand", "Table", "Plinth"] as const

/** The furniture casts; the shell it sits in only receives. */
const CASTERS = new Set<string>(["Table", "Plinth"])

export function SaloonShell() {
  const { nodes } = useGLTF(MODEL)

  const materials = React.useMemo(
    () =>
      ({
        // A shade deeper than the walls, so the floor reads as its own plane
        // instead of merging with them.
        Floor: new MeshStandardMaterial({
          name: "Floor",
          color: "#bb9a74",
          roughness: 0.97,
          metalness: 0,
          envMapIntensity: 0.12,
        }),
        // Warm sand clay. High roughness, no metalness, and almost no
        // environment: the key and fill do all the shaping.
        Sand: new MeshStandardMaterial({
          name: "Sand",
          color: "#cdb08c",
          roughness: 0.96,
          metalness: 0,
          envMapIntensity: 0.15,
        }),
        Table: new MeshStandardMaterial({
          name: "Table",
          color: "#5e4630",
          roughness: 0.88,
          metalness: 0,
          envMapIntensity: 0.15,
        }),
        Plinth: new MeshStandardMaterial({
          name: "Plinth",
          color: "#4a382a",
          roughness: 0.92,
          metalness: 0,
          envMapIntensity: 0.12,
        }),
      }) satisfies Record<(typeof SLOTS)[number], MeshStandardMaterial>,
    []
  )

  React.useEffect(
    () => () => Object.values(materials).forEach((material) => material.dispose()),
    [materials]
  )

  return (
    <group name="saloon-shell">
      {SLOTS.map((slot) => {
        const node = nodes[slot] as Mesh | undefined
        if (!node) return null
        return (
          <mesh
            key={slot}
            geometry={node.geometry}
            material={materials[slot]}
            castShadow={CASTERS.has(slot)}
            receiveShadow
          />
        )
      })}
    </group>
  )
}

/**
 * Shown while the shell loads and if it fails to load. It keeps the room warm
 * and the table where the camera expects it, so the DOM controls, orbs and
 * camera poses all stay usable without the asset.
 */
export function ShellPlaceholder() {
  return (
    <group name="saloon-shell-placeholder">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ROOM.inner, 64]} />
        <meshStandardMaterial color="#b39a78" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[0, TABLE_SURFACE_Y - 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.38, 48]} />
        <meshStandardMaterial color="#5e4630" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.6, 32]} />
        <meshStandardMaterial color="#4a382a" roughness={0.92} metalness={0} />
      </mesh>
    </group>
  )
}

/**
 * Keeps a failed asset local to the room. Lights, orbs, camera and every DOM
 * control live outside this boundary, so a missing file degrades the scene
 * instead of blanking it.
 */
export class AssetBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

useGLTF.preload(MODEL)
