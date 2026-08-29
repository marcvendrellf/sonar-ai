"use client"

import * as React from "react"
import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  ACESFilmicToneMapping,
  MathUtils,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three"

import { AgentOrb, ORB_RADIUS } from "./agent-orb"
import {
  AssetBoundary,
  createClayBumpTexture,
  SaloonShell,
  ShellPlaceholder,
} from "./saloon-shell"
import { agents, type AgentId } from "./run-fixture"

const SEAT_RADIUS = 2.68

/** Orb centre, seated just above the matching U-shaped chair rail. */
const ORB_Y = 1.36

/** The overview keeps the entire committee and its shadows in frame. */
const FRAMED_HALF_WIDTH = 5.55
const FRAMED_HALF_HEIGHT = 4.25

/** Frame-rate-independent damping for the camera rig's vectors. */
function damp3(current: Vector3, target: Vector3, lambda: number, delta: number) {
  current.lerp(target, 1 - Math.exp(-lambda * delta))
}

/** The table overview is an elevated dark-floor composition. */
const TABLE_POSE = {
  target: new Vector3(0, 0.78, 0),
  direction: new Vector3(0, Math.sin(MathUtils.degToRad(35)), Math.cos(MathUtils.degToRad(35))),
  distance: 15.5,
  fov: 27,
}

/** The selected orb fills a reliable portion of the interview frame. */
const INTERVIEW_FRAMING = 1.3
const INTERVIEW_LIFT = 1.85

export function seatPosition(seat: number): [number, number, number] {
  const angle = (seat / agents.length) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * SEAT_RADIUS, ORB_Y, Math.sin(angle) * SEAT_RADIUS]
}

/**
 * Three overhead fixtures form a restrained, real-world lamp pool. Only the
 * primary lamp owns a shadow map; the surrounding lamps add physical-looking
 * bounce without multiplying the presentation-laptop shadow cost.
 */
function SceneLight() {
  return (
    <>
      <ambientLight color="#211b20" intensity={0.05} />
      <spotLight
        castShadow
        color="#ffb875"
        intensity={500}
        position={[-2.4, 8.5, 2.4]}
        angle={0.58}
        penumbra={0.9}
        distance={20}
        decay={2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
      />
      <spotLight
        color="#f39c5a"
        intensity={180}
        position={[4.4, 6.7, -1.8]}
        angle={0.52}
        penumbra={0.92}
        distance={17}
        decay={2}
      />
      <spotLight
        color="#d9a57a"
        intensity={130}
        position={[-4.3, 5.8, -2.6]}
        angle={0.48}
        penumbra={0.94}
        distance={16}
        decay={2}
      />
    </>
  )
}

/** Bloom gives the lightly emissive clay orbs their restrained soft halo. */
function SceneEffects({ selected, reduceMotion }: { selected: AgentId | null; reduceMotion: boolean }) {
  const focusTarget = React.useMemo(() => {
    if (!selected) return null
    const agent = agents.find((entry) => entry.id === selected)
    return agent ? seatPosition(agent.seat) : null
  }, [selected])

  return (
    <EffectComposer depthBuffer multisampling={0} resolutionScale={selected ? 0.8 : 1}>
      <Bloom intensity={0.4} luminanceThreshold={0.7} luminanceSmoothing={0.85} mipmapBlur />
      {focusTarget && !reduceMotion ? (
        <DepthOfField
          target={focusTarget}
          focalLength={0.014}
          bokehScale={0.55}
          resolutionScale={0.6}
        />
      ) : null}
    </EffectComposer>
  )
}

/** One rig owns camera position, target, and field of view. */
function CameraRig({
  selected,
  reduceMotion,
}: {
  selected: AgentId | null
  reduceMotion: boolean
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const look = React.useRef(TABLE_POSE.target.clone())
  const aspect = size.width / size.height

  const { fov, tableDistance } = React.useMemo(() => {
    const half = Math.tan(MathUtils.degToRad(TABLE_POSE.fov) / 2)
    const reach = Math.max(FRAMED_HALF_WIDTH / (half * aspect), FRAMED_HALF_HEIGHT / half)
    const distance = MathUtils.clamp(reach, TABLE_POSE.distance, 30)
    const opened = MathUtils.radToDeg(
      2 * Math.atan(Math.max(FRAMED_HALF_WIDTH / aspect, FRAMED_HALF_HEIGHT) / distance)
    )
    return { fov: MathUtils.clamp(opened, TABLE_POSE.fov, 44), tableDistance: distance }
  }, [aspect])

  const pose = React.useMemo(() => {
    const overview = {
      position: TABLE_POSE.target.clone().addScaledVector(TABLE_POSE.direction, tableDistance),
      target: TABLE_POSE.target,
    }
    if (!selected) return overview

    const agent = agents.find((entry) => entry.id === selected)
    if (!agent) return overview

    const [x, y, z] = seatPosition(agent.seat)
    const outward = new Vector3(x, 0, z).normalize()
    const distance = INTERVIEW_FRAMING / Math.tan(MathUtils.degToRad(fov) / 2)
    const reach = Math.sqrt(Math.max(0.5, distance ** 2 - INTERVIEW_LIFT ** 2))
    return {
      position: new Vector3(x, y + INTERVIEW_LIFT, z).addScaledVector(outward, reach),
      target: new Vector3(x, y, z),
    }
  }, [fov, selected, tableDistance])

  React.useEffect(() => {
    if (!reduceMotion) return
    camera.position.copy(pose.position)
    look.current.copy(pose.target)
    camera.lookAt(look.current)
  }, [camera, pose, reduceMotion])

  useFrame((state, delta) => {
    const lens = state.camera as PerspectiveCamera
    if (lens.fov !== fov) {
      lens.fov = fov
      lens.updateProjectionMatrix()
    }

    if (reduceMotion) return
    damp3(camera.position, pose.position, 4.5, delta)
    damp3(look.current, pose.target, 5, delta)
    camera.lookAt(look.current)
  })

  return null
}

export function SaloonScene({
  selected,
  reduceMotion,
  onSelect,
}: {
  selected: AgentId | null
  reduceMotion: boolean
  onSelect: (id: AgentId | null) => void
}) {
  const orbGeometry = React.useMemo(() => new SphereGeometry(ORB_RADIUS, 48, 48), [])
  const clayTexture = React.useMemo(() => createClayBumpTexture(), [])
  const [shellFailed, setShellFailed] = React.useState(false)

  React.useEffect(
    () => () => {
      orbGeometry.dispose()
      clayTexture.dispose()
    },
    [clayTexture, orbGeometry]
  )

  const onShellError = React.useCallback(() => setShellFailed(true), [])

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        shadows="variance"
        camera={{ position: [0, 9.6, 13.7], fov: TABLE_POSE.fov, near: 0.1, far: 90 }}
        onPointerMissed={() => onSelect(null)}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 0.82
        }}
      >
        <color attach="background" args={["#08090d"]} />

        <SceneLight />

        {/* A continuous shadow receiver prevents any floor edge in interview views. */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial
            color="#17191d"
            roughness={0.97}
            metalness={0}
            bumpMap={clayTexture}
            bumpScale={0.026}
          />
        </mesh>

        <AssetBoundary fallback={<ShellPlaceholder />} onError={onShellError}>
          <React.Suspense fallback={<ShellPlaceholder />}>
            <SaloonShell clayTexture={clayTexture} />
          </React.Suspense>
        </AssetBoundary>

        <CameraRig selected={selected} reduceMotion={reduceMotion} />

        {agents.map((agent) => (
          <AgentOrb
            key={agent.id}
            agent={agent}
            position={seatPosition(agent.seat)}
            geometry={orbGeometry}
            clayTexture={clayTexture}
            selected={selected === agent.id}
            labelled={selected === null}
            reduceMotion={reduceMotion}
            onSelect={() => onSelect(agent.id)}
          />
        ))}

        <SceneEffects selected={selected} reduceMotion={reduceMotion} />
      </Canvas>

      {shellFailed ? (
        <p
          role="status"
          className="saloon-canvas-note pointer-events-none absolute top-3 left-4 rounded-md px-2 py-1 text-[11px]"
        >
          Scene model unavailable. Agents, selection and details still work.
        </p>
      ) : null}
    </>
  )
}
