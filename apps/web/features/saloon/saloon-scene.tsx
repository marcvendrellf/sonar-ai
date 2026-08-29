"use client"

import * as React from "react"
import { AccumulativeShadows, Environment, RandomizedLight } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { MathUtils, SphereGeometry, Vector3, type PerspectiveCamera } from "three"

import { AgentOrb, ORB_RADIUS } from "./agent-orb"
import { AssetBoundary, SaloonShell, ShellPlaceholder, TABLE_SURFACE_Y } from "./saloon-shell"
import { agents, type AgentId, type AgentState } from "./run-fixture"

const SEAT_RADIUS = 2.55

/** Orb centre. The plinth tops are at the table surface, just below this. */
const ORB_Y = 1.62

/**
 * What the diorama view has to keep in frame: the room's width, and its
 * projected height, which is the depth seen at the camera's elevation plus the
 * back wall. Both matter, because the cutaway rim is the bottom of the subject.
 */
const FRAMED_HALF_WIDTH = 7.6
const FRAMED_HALF_HEIGHT = 5.2

/**
 * Frame-rate independent exponential damping. One helper, one owner: the camera
 * rig is the only thing that moves these vectors.
 */
function damp3(current: Vector3, target: Vector3, lambda: number, delta: number) {
  current.lerp(target, 1 - Math.exp(-lambda * delta))
}

/**
 * The overview pose. The camera stands outside the cutaway and looks down into
 * it at about 32 degrees, so the room reads as one object on a dark ground.
 */
const TABLE_POSE = {
  target: new Vector3(0, 1, -0.9),
  direction: new Vector3(0, Math.sin(MathUtils.degToRad(32)), Math.cos(MathUtils.degToRad(32))),
  distance: 18.5,
  fov: 26,
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
const INTERVIEW_LIFT = 2.8

export function seatPosition(seat: number): [number, number, number] {
  const angle = (seat / agents.length) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * SEAT_RADIUS, ORB_Y, Math.sin(angle) * SEAT_RADIUS]
}

/**
 * One locally stored evening interior, loaded at very low intensity. It gives
 * the orbs something to reflect and contributes almost nothing to the clay.
 * Never swap this for a drei preset, which downloads at runtime and breaks
 * offline mode.
 */
function SaloonEnvironment() {
  return (
    <Environment
      files="/environments/saloon/warm_restaurant_night_1k.hdr"
      environmentIntensity={0.18}
    />
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
    // Reduced motion cuts between poses instead of flying through the room.
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

/**
 * The relationship path, inlaid in the table top. Besides agent state this is
 * the only cyan in the room: seven nodes and their links, revealed as the run
 * traces the path, so the evidence has a physical readout.
 */
const PATH_NODES: readonly (readonly [number, number])[] = [
  [-1.42, 0.52],
  [-0.94, -0.34],
  [-0.28, 0.44],
  [0.16, -0.46],
  [0.78, 0.26],
  [1.18, -0.4],
  [1.5, 0.34],
]

function EvidencePath({ progress }: { progress: number }) {
  const revealed = Math.round(MathUtils.clamp(progress, 0, 1) * PATH_NODES.length)

  // Fixed geometry, toggled by visibility: tracing the path allocates nothing.
  const links = React.useMemo(
    () =>
      PATH_NODES.slice(1).map(([x, z], index) => {
        const [px, pz] = PATH_NODES[index]
        return {
          position: [(px + x) / 2, -(pz + z) / 2] as const,
          length: Math.hypot(x - px, z - pz),
          angle: -Math.atan2(z - pz, x - px),
        }
      }),
    []
  )

  return (
    <group position={[0, TABLE_SURFACE_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {links.map((link, index) => (
        <mesh
          key={`link-${index}`}
          position={[link.position[0], link.position[1], 0]}
          rotation={[0, 0, link.angle]}
          visible={index + 2 <= revealed}
        >
          <planeGeometry args={[link.length, 0.016]} />
          <meshStandardMaterial color="#39bdd1" emissive="#39bdd1" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {PATH_NODES.map(([x, z], index) => (
        <mesh key={`node-${index}`} position={[x, -z, 0]} visible={index < revealed}>
          <circleGeometry args={[0.062, 20]} />
          <meshStandardMaterial color="#39bdd1" emissive="#39bdd1" emissiveIntensity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export function SaloonScene({
  runtime,
  selected,
  pathProgress,
  reduceMotion,
  onSelect,
}: {
  runtime: Record<AgentId, { state: AgentState }>
  selected: AgentId | null
  pathProgress: number
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
        shadows
        // 1.5 is the budget for the presentation laptop.
        dpr={[1, 1.5]}
        camera={{ position: [0, 10.8, 15.7], fov: TABLE_POSE.fov, near: 0.1, far: 90 }}
        onPointerMissed={() => onSelect(null)}
        gl={{ antialias: true }}
      >
        {/* The diorama sits on a dark ground, as in the supplied reference. No
            fog: the room is an object, not a space the camera is inside. */}
        <color attach="background" args={["#211710"]} />

        {/* Optional warmth. If it fails the key still lights the room, so it
            gets its own boundary. */}
        <AssetBoundary fallback={null}>
          <React.Suspense fallback={null}>
            <SaloonEnvironment />
          </React.Suspense>
        </AssetBoundary>

        {/* One very broad warm key at roughly 3,000 K, and a weak fill so unlit
            clay faces stay legible without losing their form. Nothing casts a
            hard highlight: the shadow below is accumulated, not mapped. */}
        <spotLight
          position={[0, 7.0, 0.2]}
          target-position={[0, 0.9, 0]}
          angle={0.82}
          penumbra={1}
          intensity={265}
          distance={26}
          decay={2}
          color="#ffc48d"
        />
        <directionalLight position={[5, 9, 7]} intensity={0.5} color="#ffd7ae" />
        <hemisphereLight args={["#cbd6e4", "#6f5a44", 0.2]} />

        <AssetBoundary fallback={<ShellPlaceholder />} onError={onShellError}>
          <React.Suspense fallback={<ShellPlaceholder />}>
            <SaloonShell />
            {/* Accumulated once over 60 frames, then static: one broad, blurred,
                low-contrast shadow across the floor. Mounted with the shell so
                it never bakes an empty room. */}
            <AccumulativeShadows
              temporal
              frames={60}
              scale={15}
              position={[0, 0.02, 0]}
              alphaTest={0.8}
              opacity={0.78}
              color="#3a2a1b"
            >
              <RandomizedLight
                amount={8}
                radius={5}
                ambient={0.55}
                intensity={1.8}
                position={[1.2, 8.5, 1.5]}
                size={18}
                bias={0.001}
              />
            </AccumulativeShadows>
          </React.Suspense>
        </AssetBoundary>

        <CameraRig selected={selected} reduceMotion={reduceMotion} />
        <EvidencePath progress={pathProgress} />

        {agents.map((agent) => (
          <AgentOrb
            key={agent.id}
            agent={agent}
            state={runtime[agent.id].state}
            position={seatPosition(agent.seat)}
            geometry={orbGeometry}
            selected={selected === agent.id}
            dimmed={selected !== null && selected !== agent.id}
            labelled={selected === null}
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
