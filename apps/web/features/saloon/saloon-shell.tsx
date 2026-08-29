"use client"

import * as React from "react"
import { useGLTF } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import {
  LinearSRGBColorSpace,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Object3D,
} from "three"
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js"

/**
 * The static Saloon: an open clay floor and furniture set, authored by the
 * geometry and Cycles bake scripts and stored locally. Nothing here is interactive. The six
 * agent orbs, their hit areas and the camera stay in React.
 *
 * The shell carries two UV sets. A shared half-float EXR on TEXCOORD_1 holds
 * direct and indirect Cycles illumination. The table and plinth sample that
 * atlas while all four runtime materials supply flat clay colours. The open
 * floor responds only to runtime light so its horizon remains continuous.
 */

const MODEL = "/models/saloon/saloon-shell.glb"
const LIGHTMAP = "/textures/saloon/saloon-lightmap.exr"

class SaloonLightmapLoader extends EXRLoader {
  override load(
    url: Parameters<EXRLoader["load"]>[0],
    onLoad?: Parameters<EXRLoader["load"]>[1],
    onProgress?: Parameters<EXRLoader["load"]>[2],
    onError?: Parameters<EXRLoader["load"]>[3]
  ): ReturnType<EXRLoader["load"]> {
    return super.load(
      url,
      (texture, textureData) => {
        texture.flipY = false
        texture.channel = 1
        texture.colorSpace = LinearSRGBColorSpace
        texture.needsUpdate = true
        onLoad?.(texture, textureData)
      },
      onProgress,
      onError
    )
  }
}

/** Open floor dimensions baked into the shell. */
export const ROOM = {
  inner: 14,
} as const

/** Top surface of the table slab, set in the authoring script. */
export const TABLE_SURFACE_Y = 0.98

/** Merged mesh per material. Four draw calls for the complete static set. */
const SLOTS = ["Floor", "Sand", "Table", "Plinth"] as const

function shellGeometry(nodes: Record<string, Object3D>, slot: (typeof SLOTS)[number]) {
  const node = nodes[slot]
  if (!(node instanceof Mesh)) {
    throw new Error(`Saloon shell is missing mesh ${slot}`)
  }
  if (!node.geometry.getAttribute("uv") || !node.geometry.getAttribute("uv1")) {
    throw new Error(`Saloon shell mesh ${slot} must contain base and lightmap UV sets`)
  }
  return node.geometry
}

export function SaloonShell() {
  const { nodes } = useGLTF(MODEL)
  const lightMap = useLoader(SaloonLightmapLoader, LIGHTMAP)

  const geometries = React.useMemo(
    () =>
      ({
        Floor: shellGeometry(nodes, "Floor"),
        Sand: shellGeometry(nodes, "Sand"),
        Table: shellGeometry(nodes, "Table"),
        Plinth: shellGeometry(nodes, "Plinth"),
      }) satisfies Record<(typeof SLOTS)[number], BufferGeometry>,
    [nodes]
  )

  const materials = React.useMemo(
    () =>
      ({
        Floor: new MeshStandardMaterial({
          name: "Floor",
          color: "#d8d2c8",
          roughness: 0.97,
          metalness: 0,
          envMapIntensity: 0,
        }),
        Sand: new MeshStandardMaterial({
          name: "Sand",
          color: "#c4bdb2",
          roughness: 0.97,
          metalness: 0,
          envMapIntensity: 0,
        }),
        Table: new MeshStandardMaterial({
          name: "Table",
          color: "#6c6257",
          roughness: 0.9,
          metalness: 0,
          envMapIntensity: 0,
          lightMap,
          lightMapIntensity: 0.35,
        }),
        Plinth: new MeshStandardMaterial({
          name: "Plinth",
          color: "#514a43",
          roughness: 0.93,
          metalness: 0,
          envMapIntensity: 0,
          lightMap,
          lightMapIntensity: 0.35,
        }),
      }) satisfies Record<(typeof SLOTS)[number], MeshStandardMaterial>,
    [lightMap]
  )

  React.useEffect(
    () => () => Object.values(materials).forEach((material) => material.dispose()),
    [materials]
  )

  return (
    <group name="saloon-shell">
      {SLOTS.map((slot) => (
        <mesh
          key={slot}
          geometry={geometries[slot]}
          material={materials[slot]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}

/**
 * Shown while the shell or lightmap loads and if either fails. Standard clay
 * materials keep the floor and furniture responsive to the runtime light.
 */
export function ShellPlaceholder() {
  return (
    <group name="saloon-shell-placeholder">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ROOM.inner, 64]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.97} />
      </mesh>
      <mesh position={[0, TABLE_SURFACE_Y - 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.6, 48]} />
        <meshStandardMaterial color="#6c6257" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.4, 32]} />
        <meshStandardMaterial color="#514a43" roughness={0.93} />
      </mesh>
    </group>
  )
}

/**
 * Keeps a failed asset local to the static set. The orbs, camera and every DOM
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
useLoader.preload(SaloonLightmapLoader, LIGHTMAP)
