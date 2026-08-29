"use client"

import * as React from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import {
  MathUtils,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Mesh,
  type Texture,
} from "three"

import { type Agent } from "./run-fixture"
import { TABLE_SURFACE_Y } from "./saloon-shell"

/** Shared visual radius for all six agents. */
export const ORB_RADIUS = 0.46

/**
 * One naturally lit agent orb. Both hover and selection ease into a gentle
 * float; the selected state stays slightly higher and brighter.
 */
export function AgentOrb({
  agent,
  position,
  geometry,
  clayTexture,
  selected,
  labelled,
  reduceMotion,
  onSelect,
}: {
  agent: Agent
  position: [number, number, number]
  geometry: BufferGeometry
  clayTexture: Texture
  selected: boolean
  labelled: boolean
  reduceMotion: boolean
  onSelect: () => void
}) {
  const visual = React.useRef<Group>(null)
  const orb = React.useRef<Mesh>(null)
  const floatPhase = React.useRef(0)
  const [hovered, setHovered] = React.useState(false)
  const baseHeight = position[1] - TABLE_SURFACE_Y

  useFrame((_, delta) => {
    const node = visual.current
    if (!node) return

    floatPhase.current += delta * 0.68
    const floats = !reduceMotion && (selected || hovered)
    const lift = selected ? 0.085 : hovered ? 0.052 : 0
    const amplitude = selected ? 0.052 : hovered ? 0.032 : 0
    const floatOffset = floats ? lift + Math.sin(floatPhase.current) * amplitude : 0
    node.position.y = MathUtils.damp(node.position.y, baseHeight + floatOffset, 1.85, delta)

    const targetScale = selected ? 1.12 : hovered ? 1.055 : 1
    const nextScale = MathUtils.damp(node.scale.x, targetScale, 2.15, delta)
    node.scale.setScalar(nextScale)

    const material = orb.current?.material
    if (material instanceof MeshStandardMaterial) {
      const glow = selected ? 0.62 : hovered ? 0.36 : 0.16
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, glow, 2.2, delta)
      material.roughness = MathUtils.damp(material.roughness, selected ? 0.6 : 0.7, 2.2, delta)
    }
  })

  return (
    <group position={[position[0], TABLE_SURFACE_Y, position[2]]}>
      <group ref={visual} position={[0, baseHeight, 0]}>
        <mesh
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
          onPointerOver={(event) => {
            event.stopPropagation()
            setHovered(true)
            document.body.style.cursor = "pointer"
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = "auto"
          }}
        >
          <sphereGeometry args={[ORB_RADIUS * 1.8, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <mesh ref={orb} geometry={geometry} castShadow>
          <meshStandardMaterial
            color={agent.color}
            emissive={agent.color}
            emissiveIntensity={0.16}
            roughness={0.7}
            metalness={0}
            envMapIntensity={0}
            bumpMap={clayTexture}
            bumpScale={0.012}
          />
        </mesh>

        {labelled ? (
          <Html
            center
            position={[0, -ORB_RADIUS - 0.28, 0]}
            distanceFactor={9}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="saloon-orb-name select-none whitespace-nowrap text-[12px] font-medium tracking-tight">
              {agent.name}
            </span>
          </Html>
        ) : null}
      </group>
    </group>
  )
}
