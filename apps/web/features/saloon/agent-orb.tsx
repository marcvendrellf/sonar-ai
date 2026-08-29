"use client"

import * as React from "react"
import { useFrame } from "@react-three/fiber"
import {
  MathUtils,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Mesh,
} from "three"

import { type Agent } from "./run-fixture"
import { TABLE_SURFACE_Y } from "./saloon-shell"

/** Shared visual radius for all six agents. */
export const ORB_RADIUS = 0.46

/**
 * One naturally lit agent orb. Selection owns the slow float; pointer hover only
 * eases the orb's scale and never snaps geometry between sizes.
 */
export function AgentOrb({
  agent,
  position,
  geometry,
  selected,
  reduceMotion,
  onSelect,
}: {
  agent: Agent
  position: [number, number, number]
  geometry: BufferGeometry
  selected: boolean
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

    if (selected && !reduceMotion) {
      floatPhase.current += delta * 0.72
    } else {
      floatPhase.current = 0
    }

    const floatOffset =
      selected && !reduceMotion ? 0.055 + Math.sin(floatPhase.current) * 0.055 : 0
    node.position.y = MathUtils.damp(node.position.y, baseHeight + floatOffset, 2.4, delta)

    const targetScale = selected ? 1.12 : hovered ? 1.045 : 1
    const nextScale = MathUtils.damp(node.scale.x, targetScale, 3.2, delta)
    node.scale.setScalar(nextScale)

    const material = orb.current?.material
    if (material instanceof MeshStandardMaterial) {
      material.roughness = MathUtils.damp(material.roughness, selected ? 0.64 : 0.72, 3, delta)
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
            roughness={0.72}
            metalness={0}
            envMapIntensity={0}
          />
        </mesh>
      </group>
    </group>
  )
}
