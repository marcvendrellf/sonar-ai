"use client"

import * as React from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  ACESFilmicToneMapping,
  MathUtils,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three"

import { AgentOrb, ORB_RADIUS } from "./agent-orb"
import { AssetBoundary, SaloonShell, ShellPlaceholder } from "./saloon-shell"
import { agents, type AgentId } from "./run-fixture"

const SEAT_RADIUS = 2.55

/** Orb centre. The plinth tops are at the table surface, just below this. */
const ORB_Y = 1.62

/**
 * What the table view keeps in frame: the complete six-seat gathering and
 * enough open floor for the soft cast shadows.
 */
const FRAMED_HALF_WIDTH = 4.6
const FRAMED_HALF_HEIGHT = 3.7

/**
 * Frame-rate independent exponential damping. One helper, one owner: the camera
 * rig is the only thing that moves these vectors.
 */
function damp3(current: Vector3, target: Vector3, lambda: number, delta: number) {
  current.lerp(target, 1 - Math.exp(-lambda * delta))
}

/**
 * The overview pose looks down on the table at 35 degrees so the gathering and
 * its cast shadows read clearly against the open floor.
 */
const TABLE_POSE = {
  target: new Vector3(0, 0.85, 0),
  direction: new Vector3(0, Math.sin(MathUtils.degToRad(35)), Math.cos(MathUtils.degToRad(35))),
  distance: 15,
  fov: 27,
}

/**
 * Interview framing, as the distance that holds the orb at a constant share of
 * the frame: `distance = INTERVIEW_FRAMING / tan(fov / 2)`. A narrower lens
 * stands further back, so the composition survives every viewport shape.
 */
const INTERVIEW_FRAMING = 1.29

/**
 * How far the interview pose rises above the orb. At this framing the camera
 * usually ends up beyond the wall it is looking over, so the lift is what keeps
 * the sight line clear of the rim: the pose is level enough to read as frontal
 * and high enough that no wall crosses it.
 */
const INTERVIEW_LIFT = 2

export function seatPosition(seat: number): [number, number, number] {
  const angle = (seat / agents.length) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * SEAT_RADIUS, ORB_Y, Math.sin(angle) * SEAT_RADIUS]
}

/** One warm overhead key with a broad, softly filtered shadow footprint. */
function SceneLight() {
  return (
    <>
      <directionalLight
        castShadow
        color="#ffd0a6"
        intensity={3.35}
        position={[-2.8, 10, 1]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-bias={-0.00025}
        shadow-normalBias={0.035}
        shadow-intensity={0.68}
        shadow-radius={11}
        shadow-blurSamples={24}
      />
      <hemisphereLight args={["#f4d7bd", "#aa907a", 0.58]} />
    </>
  )
}

/**
 * One rig owns the camera. Selection state and viewport shape are its only
 * inputs, so nothing else animates these values.
 */
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

  // A narrow viewport cannot hold the diorama at the authored framing. Stand
  // back first, then open the field of view.
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
    // Hold the orb at a constant share of the frame: a wider field of view has
    // to come closer for the interview composition to stay the same. The lift
    // is spent first, and whatever distance is left goes outward.
    const distance = INTERVIEW_FRAMING / Math.tan(MathUtils.degToRad(fov) / 2)
    const reach = Math.sqrt(Math.max(0.5, distance ** 2 - INTERVIEW_LIFT ** 2))
    return {
      position: new Vector3(x, y + INTERVIEW_LIFT, z).addScaledVector(outward, reach),
      target: new Vector3(x, y, z),
    }
  }, [fov, selected, tableDistance])

  React.useEffect(() => {
    if (!reduceMotion) return
    // Reduced motion cuts between poses instead of flying across the scene.
    camera.position.copy(pose.position)
    look.current.copy(pose.target)
    camera.lookAt(look.current)
  }, [camera, pose, reduceMotion])

  useFrame((state, delta) => {
    // The field of view is part of the pose, so the rig owns it too. It changes
    // only when the viewport is resized.
    const lens = state.camera as PerspectiveCamera
    if (lens.fov !== fov) {
      lens.fov = fov
      lens.updateProjectionMatrix()
    }

    if (reduceMotion) return
    // ~600 ms to settle, inside the 500-800 ms budget for the interview move.
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
  const [shellFailed, setShellFailed] = React.useState(false)

  React.useEffect(() => () => orbGeometry.dispose(), [orbGeometry])

  const onShellError = React.useCallback(() => setShellFailed(true), [])

  return (
    <>
      <Canvas
        // 1.5 is the budget for the presentation laptop.
        dpr={[1, 1.5]}
        shadows="variance"
        camera={{ position: [0, 9.6, 13.7], fov: TABLE_POSE.fov, near: 0.1, far: 90 }}
        onPointerMissed={() => onSelect(null)}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={["#dfc5a6"]} />

        <SceneLight />

        {/* Continue the open floor beyond the authored slab so interview cameras
            never reveal a room edge or a background seam. */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#d8d2c8" roughness={0.97} metalness={0} />
        </mesh>

        <AssetBoundary fallback={<ShellPlaceholder />} onError={onShellError}>
          <React.Suspense fallback={<ShellPlaceholder />}>
            <SaloonShell />
          </React.Suspense>
        </AssetBoundary>

        <CameraRig selected={selected} reduceMotion={reduceMotion} />

        {agents.map((agent) => (
          <AgentOrb
            key={agent.id}
            agent={agent}
            position={seatPosition(agent.seat)}
            geometry={orbGeometry}
            selected={selected === agent.id}
            reduceMotion={reduceMotion}
            onSelect={() => onSelect(agent.id)}
          />
        ))}
      </Canvas>

      {shellFailed ? (
        <p
          role="status"
          className="saloon-canvas-note pointer-events-none absolute top-3 left-4 rounded-md px-2 py-1 text-[11px]"
        >
          Room model unavailable. Agents, selection and details still work.
        </p>
      ) : null}
    </>
  )
}
