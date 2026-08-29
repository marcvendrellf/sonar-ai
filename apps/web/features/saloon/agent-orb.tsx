"use client"

import * as React from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { BufferGeometry, Group, Mesh, MeshStandardMaterial } from "three"

import { stateLabels, type Agent, type AgentState } from "./run-fixture"

/**
 * Orb radius, sized against the clay diorama so six agents read clearly from
 * the overview camera. The scene builds the shared sphere geometry from it and
 * every ring below is derived from it, so one value changes the whole orb.
 */
export const ORB_RADIUS = 0.46

/**
 * State is carried by shape and movement, never by colour alone: bobbing, spin,
 * height, and the ring around the orb all change with state, and the DOM label
 * under each orb spells the state out.
 */
const behaviour: Record<
  AgentState,
  { bob: number; spin: number; emissive: number; lift: number; ring: "none" | "active" | "halt" | "done" }
> = {
  idle: { bob: 0, spin: 0.08, emissive: 0.06, lift: 0, ring: "none" },
  reading: { bob: 0.05, spin: 0.55, emissive: 0.34, lift: 0.02, ring: "active" },
  tracing: { bob: 0.07, spin: 0.8, emissive: 0.4, lift: 0.03, ring: "active" },
  debating: { bob: 0.1, spin: 1.1, emissive: 0.46, lift: 0.04, ring: "active" },
  "checking-risk": { bob: 0.035, spin: 0.34, emissive: 0.4, lift: 0.02, ring: "active" },
  executing: { bob: 0.12, spin: 1.45, emissive: 0.62, lift: 0.05, ring: "active" },
  blocked: { bob: 0, spin: 0, emissive: 0.14, lift: -0.13, ring: "halt" },
  complete: { bob: 0, spin: 0.12, emissive: 0.5, lift: 0.07, ring: "done" },
}

/**
 * The clay room is lit broadly and softly, so a little emission reads as agent
 * activity rather than a wash. It stays low enough that the ring, motion and
 * written label still carry the state on their own.
 */
const EMISSIVE_SCALE = 0.4

export function AgentOrb({
  agent,
  state,
  position,
  geometry,
  selected,
  dimmed,
  labelled,
  reduceMotion,
  onSelect,
}: {
  agent: Agent
  state: AgentState
  position: [number, number, number]
  geometry: BufferGeometry
  selected: boolean
  dimmed: boolean
  /** Labels belong to the table view. The interview view names the agent in DOM. */
  labelled: boolean
  reduceMotion: boolean
  onSelect: () => void
}) {
  const group = React.useRef<Group>(null)
  const orb = React.useRef<Mesh>(null)
  const ring = React.useRef<Group>(null)
  const [hovered, setHovered] = React.useState(false)

  const config = behaviour[state]

  useFrame((frame, delta) => {
    const node = group.current
    if (!node) return

    const time = frame.clock.elapsedTime
    const bob = reduceMotion ? 0 : Math.sin(time * 1.6 + agent.seat) * config.bob
    node.position.y = position[1] + config.lift + bob

    if (orb.current && !reduceMotion) {
      orb.current.rotation.y += delta * config.spin
    }
    // Only the active ring spins. The halt and done rings are static shapes,
    // so rotating them would tilt the flat disc that marks a finished agent.
    if (ring.current) {
      if (config.ring === "active" && !reduceMotion) {
        ring.current.rotation.z += delta * 0.9
      } else {
        ring.current.rotation.z = 0
      }
    }

    const material = orb.current?.material as MeshStandardMaterial | undefined
    if (material) {
      // The selected agent carries the strongest contrast in the room. Warm
      // agent colours would otherwise sink into the warm clay when idle, so
      // selection sets a floor under the emission rather than scaling zero.
      const lit = selected ? Math.max(config.emissive, 0.5) : config.emissive
      const target =
        lit * EMISSIVE_SCALE * (selected ? 1.5 : hovered ? 1.25 : 1) * (dimmed ? 0.45 : 1)
      material.emissiveIntensity += (target - material.emissiveIntensity) * Math.min(1, delta * 6)
      const opacity = dimmed ? 0.5 : 1
      material.opacity += (opacity - material.opacity) * Math.min(1, delta * 6)
    }
  })

  const scale = selected ? 1.18 : hovered ? 1.08 : 1

  return (
    <group ref={group} position={position}>
      {/* Hit area is deliberately larger than the visible orb. */}
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

      <mesh ref={orb} geometry={geometry} scale={scale} castShadow>
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={config.emissive * EMISSIVE_SCALE}
          // Slightly smoother than the clay around them, and no more: the orbs
          // must never read as glass or chrome.
          roughness={0.62}
          metalness={0}
          envMapIntensity={0.5}
          transparent
        />
      </mesh>

      <group ref={ring}>
        {config.ring === "active" ? (
          <mesh rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[ORB_RADIUS * 1.46, 0.016, 8, 64]} />
            <meshStandardMaterial
              color={agent.color}
              emissive={agent.color}
              emissiveIntensity={0.7}
              transparent
              opacity={dimmed ? 0.3 : 0.9}
            />
          </mesh>
        ) : null}
        {config.ring === "halt" ? (
          <mesh rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[ORB_RADIUS * 1.52, 0.03, 8, 64, Math.PI * 1.15]} />
            <meshStandardMaterial color="#8a4030" emissive="#8a4030" emissiveIntensity={0.5} />
          </mesh>
        ) : null}
        {config.ring === "done" ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -ORB_RADIUS, 0]}>
            <ringGeometry args={[ORB_RADIUS * 1.24, ORB_RADIUS * 1.46, 48]} />
            <meshStandardMaterial
              color={agent.color}
              emissive={agent.color}
              emissiveIntensity={0.55}
              transparent
              opacity={dimmed ? 0.3 : 0.85}
            />
          </mesh>
        ) : null}
      </group>

      {labelled ? (
      <Html
        center
        position={[0, -ORB_RADIUS - 0.28, 0]}
        distanceFactor={9}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="flex select-none flex-col items-center gap-1 whitespace-nowrap">
          <span className="saloon-orb-name text-[13px] font-semibold tracking-tight">
            {agent.name}
          </span>
          <span
            data-state={state}
            className="saloon-state inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium"
          >
            {stateLabels[state]}
          </span>
        </div>
      </Html>
      ) : null}
    </group>
  )
}
