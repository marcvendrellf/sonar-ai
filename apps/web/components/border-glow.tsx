"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import "./border-glow.css"

type BorderGlowProps = {
  animated?: boolean
  backgroundColor?: string
  borderRadius?: number
  children: ReactNode
  className?: string
  colors?: string[]
  coneSpread?: number
  edgeSensitivity?: number
  fillOpacity?: number
  glowColor?: string
  glowIntensity?: number
  glowRadius?: number
}

type GlowStyle = CSSProperties & Record<`--${string}`, string | number>

type AnimationOptions = {
  delay?: number
  duration?: number
  ease?: (value: number) => number
  end?: number
  onEnd?: () => void
  onUpdate: (value: number) => void
  start?: number
}

const DEFAULT_COLORS = ["#c084fc", "#f472b6", "#38bdf8"]
const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
]
const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
] satisfies ReadonlyArray<`--${string}`>
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

function parseHsl(hsl: string) {
  const match = hsl.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)

  return {
    h: Number.parseFloat(match?.[1] ?? "40"),
    s: Number.parseFloat(match?.[2] ?? "80"),
    l: Number.parseFloat(match?.[3] ?? "80"),
  }
}

function buildGlowVars(glowColor: string, intensity: number): GlowStyle {
  const { h, s, l } = parseHsl(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"]
  const variables: GlowStyle = {}

  opacities.forEach((opacity, index) => {
    variables[`--glow-color${keys[index] ?? ""}`] =
      `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`
  })

  return variables
}

function buildGradientVars(colors: string[]): GlowStyle {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS
  const variables: GlowStyle = {}

  GRADIENT_POSITIONS.forEach((position, index) => {
    const colorIndex = Math.min(COLOR_MAP[index] ?? 0, palette.length - 1)
    const key = GRADIENT_KEYS[index]
    const color = palette[colorIndex] ?? DEFAULT_COLORS[0] ?? "#c084fc"

    if (key) {
      variables[key] =
        `radial-gradient(at ${position}, ${color} 0px, transparent 50%)`
    }
  })

  variables["--gradient-base"] = `linear-gradient(${palette[0]} 0 100%)`
  return variables
}

function isLightColor(color: string) {
  const value = color.trim().replace("#", "")

  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) {
    return false
  }

  const hex =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)

  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function easeInCubic(value: number) {
  return value * value * value
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimationOptions) {
  let animationFrame = 0
  let timeout = 0
  const startTime = performance.now() + delay

  function tick() {
    const elapsed = performance.now() - startTime
    const progress = Math.min(Math.max(elapsed / duration, 0), 1)
    onUpdate(start + (end - start) * ease(progress))

    if (progress < 1) {
      animationFrame = requestAnimationFrame(tick)
    } else {
      onEnd?.()
    }
  }

  timeout = window.setTimeout(() => {
    animationFrame = requestAnimationFrame(tick)
  }, delay)

  return () => {
    window.clearTimeout(timeout)
    cancelAnimationFrame(animationFrame)
  }
}

export function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "#120F17",
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = DEFAULT_COLORS,
  fillOpacity = 0.5,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const getCenter = useCallback(
    (element: HTMLDivElement): readonly [number, number] => {
      const { width, height } = element.getBoundingClientRect()
      return [width / 2, height / 2]
    },
    [],
  )

  const getEdgeProximity = useCallback(
    (element: HTMLDivElement, x: number, y: number) => {
      const [centerX, centerY] = getCenter(element)
      const deltaX = x - centerX
      const deltaY = y - centerY
      const scaleX = deltaX === 0 ? Infinity : centerX / Math.abs(deltaX)
      const scaleY = deltaY === 0 ? Infinity : centerY / Math.abs(deltaY)

      return Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1)
    },
    [getCenter],
  )

  const getCursorAngle = useCallback(
    (element: HTMLDivElement, x: number, y: number) => {
      const [centerX, centerY] = getCenter(element)
      const deltaX = x - centerX
      const deltaY = y - centerY

      if (deltaX === 0 && deltaY === 0) {
        return 0
      }

      const radians = Math.atan2(deltaY, deltaX)
      const degrees = radians * (180 / Math.PI) + 90
      return degrees < 0 ? degrees + 360 : degrees
    },
    [getCenter],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const card = cardRef.current

      if (!card) {
        return
      }

      const rect = card.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const edge = getEdgeProximity(card, x, y)
      const angle = getCursorAngle(card, x, y)

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`)
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`)
    },
    [getCursorAngle, getEdgeProximity],
  )

  useEffect(() => {
    const card = cardRef.current

    if (!animated || !card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const angleStart = 110
    const angleEnd = 465
    card.classList.add("sweep-active")
    card.style.setProperty("--cursor-angle", `${angleStart}deg`)

    const cleanups = [
      animateValue({
        duration: 500,
        onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
      }),
      animateValue({
        duration: 1500,
        ease: easeInCubic,
        end: 50,
        onUpdate: (value) =>
          card.style.setProperty(
            "--cursor-angle",
            `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`,
          ),
      }),
      animateValue({
        delay: 1500,
        duration: 2250,
        ease: easeOutCubic,
        start: 50,
        end: 100,
        onUpdate: (value) =>
          card.style.setProperty(
            "--cursor-angle",
            `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`,
          ),
      }),
      animateValue({
        delay: 2500,
        duration: 1500,
        ease: easeInCubic,
        start: 100,
        end: 0,
        onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
        onEnd: () => card.classList.remove("sweep-active"),
      }),
    ]

    return () => {
      cleanups.forEach((cleanup) => cleanup())
      card.classList.remove("sweep-active")
    }
  }, [animated])

  const style: GlowStyle = {
    "--card-bg": backgroundColor,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  }

  return (
    <div
      className={`border-glow-card${isLightColor(backgroundColor) ? " border-glow-card--light" : ""} ${className}`}
      onPointerMove={handlePointerMove}
      ref={cardRef}
      style={style}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
