"use client"

import * as React from "react"
import { useGLTF } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import {
  DataTexture,
  LinearFilter,
  LinearSRGBColorSpace,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
  type BufferGeometry,
  type Object3D,
  type Texture,
} from "three"
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js"

/**
 * The static Saloon is an open dark floor, a round table, and six U-shaped
 * chairs. The agent orbs, interaction hit areas, and camera stay in React.
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

/** A tiny deterministic clay grain used only as a restrained bump map. */
export function createClayBumpTexture() {
  const size = 128
  const data = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      const broad = Math.sin(x * 0.17 + y * 0.09) * 11 + Math.cos(y * 0.21) * 7
      const random = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
      const grain = random - Math.floor(random)
      const value = Math.round(MathUtils.clamp(128 + broad + grain * 10, 0, 255))
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  texture.name = "saloon-clay-grain"
  texture.colorSpace = NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.repeat.set(5, 5)
  texture.needsUpdate = true
  return texture
}

export function SaloonShell({ clayTexture }: { clayTexture: Texture }) {
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
          color: "#17191d",
          roughness: 0.97,
          metalness: 0,
          envMapIntensity: 0,
          bumpMap: clayTexture,
          bumpScale: 0.026,
        }),
        Sand: new MeshStandardMaterial({
          name: "Sand",
          color: "#0d0f12",
          roughness: 0.98,
          metalness: 0,
          envMapIntensity: 0,
          bumpMap: clayTexture,
          bumpScale: 0.018,
        }),
        Table: new MeshStandardMaterial({
          name: "Table",
          color: "#403832",
          roughness: 0.9,
          metalness: 0,
          envMapIntensity: 0,
          bumpMap: clayTexture,
          bumpScale: 0.02,
          lightMap,
          lightMapIntensity: 0.16,
        }),
        Plinth: new MeshStandardMaterial({
          name: "Plinth",
          color: "#2d2928",
          roughness: 0.94,
          metalness: 0,
          envMapIntensity: 0,
          bumpMap: clayTexture,
          bumpScale: 0.02,
          lightMap,
          lightMapIntensity: 0.16,
        }),
      }) satisfies Record<(typeof SLOTS)[number], MeshStandardMaterial>,
    [clayTexture, lightMap]
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

/** Shown while the shell or lightmap loads and if either fails. */
export function ShellPlaceholder() {
  return (
    <group name="saloon-shell-placeholder">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[ROOM.inner, 64]} />
        <meshStandardMaterial color="#17191d" roughness={0.97} />
      </mesh>
      <mesh position={[0, TABLE_SURFACE_Y - 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.6, 48]} />
        <meshStandardMaterial color="#403832" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.4, 32]} />
        <meshStandardMaterial color="#2d2928" roughness={0.93} />
      </mesh>
    </group>
  )
}

/** Keeps a failed static set local instead of blanking the entire Saloon. */
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
