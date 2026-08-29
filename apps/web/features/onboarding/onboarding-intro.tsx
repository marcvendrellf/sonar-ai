"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  Bitcoin,
  ChartNoAxesCombined,
  Check,
  Layers3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react"

import { BorderGlow } from "@/components/border-glow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LiveOrb } from "@/components/ui/live-orb"
import { ShaderGradient } from "@/components/ui/shader-gradient"
import { cn } from "@/lib/utils"

type AssetClassId = "stocks" | "etfs" | "crypto"
type RiskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7

type IntroStage =
  | { kind: "arriving" }
  | { kind: "asking-name" }
  | { kind: "acknowledging"; displayName: string }
  | { kind: "asking-alpaca"; displayName: string }
  | { kind: "asking-risk"; displayName: string; budget: number }
  | {
      kind: "asking-assets"
      displayName: string
      budget: number
      riskLevel: RiskLevel
    }
  | {
      kind: "researching"
      displayName: string
      budget: number
      riskLevel: RiskLevel
      assetClasses: readonly AssetClassId[]
    }
  | {
      kind: "complete"
      displayName: string
      budget: number
      riskLevel: RiskLevel
      assetClasses: readonly AssetClassId[]
    }

const DISPLAY_NAME_KEY = "sonar-ai.display-name"
const ALPACA_CASH_KEY = "sonar-ai.alpaca-available-cash"
const RISK_LEVEL_KEY = "sonar-ai.risk-level"
const ASSET_CLASSES_KEY = "sonar-ai.asset-classes"
const GREETING_CHARACTERS = ["H", "i", ","] as const
const SONAR_DARK_GRADIENT = ["#020817", "#06182F", "#0A3146"]
const SONAR_GLOW_COLORS = ["#087F9D", "#39BDD1", "#8FBED2"]
const ALPACA_AVAILABLE_CASH = 100_000
const DEFAULT_RISK_LEVEL: RiskLevel = 4
const RISK_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const satisfies readonly RiskLevel[]
const RESEARCH_DURATION_MS = 30_000
const THINKING_MESSAGE_DURATION_MS = 5_000
const THINKING_MESSAGES = [
  "Reviewing current market conditions",
  "Looking for portfolio candidates",
  "Tracing relationships behind recent events",
  "Comparing possible allocations",
  "Stress-testing the portfolio against your mandate",
  "Drafting a recommendation for review",
] as const

const ASSET_CLASSES = [
  { id: "stocks", label: "U.S. stocks", icon: ChartNoAxesCombined },
  { id: "etfs", label: "Bonds", icon: Layers3 },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
] as const satisfies ReadonlyArray<{
  id: AssetClassId
  label: string
  icon: typeof ChartNoAxesCombined
}>

const cashFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function storeValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Onboarding remains usable when storage is unavailable.
  }
}

function formatCash(value: number) {
  return cashFormatter.format(value)
}

function AnimatedQuestion({
  className,
  reducedMotion,
  text,
}: {
  className?: string
  reducedMotion: boolean
  text: string
}) {
  const words = text.split(" ")

  return (
    <motion.h1
      aria-label={text}
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reducedMotion ? 0 : 0.055,
          },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          aria-hidden="true"
          className="inline-block"
          key={`${word}-${index}`}
          variants={{
            hidden: reducedMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 12, filter: "blur(8px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: reducedMotion ? 0 : 0.46,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : null}
        </motion.span>
      ))}
    </motion.h1>
  )
}

function GlowButtonFrame({ children }: { children: ReactNode }) {
  return (
    <BorderGlow
      backgroundColor="#12496E"
      borderRadius={999}
      colors={SONAR_GLOW_COLORS}
      coneSpread={28}
      edgeSensitivity={18}
      fillOpacity={0.32}
      glowColor="193 63 55"
      glowIntensity={0.8}
      glowRadius={28}
    >
      {children}
    </BorderGlow>
  )
}

function AnimatedGreeting({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <span className="sr-only">Hi, </span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: reducedMotion ? 0 : 0.1,
            },
          },
        }}
        className="inline-flex"
      >
        {GREETING_CHARACTERS.map((character, index) => (
          <motion.span
            key={`${character}-${index}`}
            variants={{
              hidden: reducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 8, filter: "blur(7px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: reducedMotion ? 0 : 0.42,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            {character}
          </motion.span>
        ))}
      </motion.span>
    </>
  )
}

function AlpacaConnectionQuestion({
  reducedMotion,
  onContinue,
}: {
  reducedMotion: boolean
  onContinue: () => void
}) {
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSynced(true)
      storeValue(ALPACA_CASH_KEY, String(ALPACA_AVAILABLE_CASH))
    }, reducedMotion ? 0 : 2_500)

    return () => window.clearTimeout(timeout)
  }, [reducedMotion])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (synced) onContinue()
  }

  return (
    <motion.form
      key="alpaca"
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl"
    >
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text="Connect your Alpaca portfolio."
      />

      <div className="mt-8 flex flex-col items-center gap-4">
        {!synced ? (
          <GlowButtonFrame>
            <Button
              type="button"
              size="lg"
              disabled
              aria-busy="true"
              className="h-11 rounded-full border-0 bg-transparent px-5 text-white shadow-none hover:bg-[#0A2338]/35 disabled:opacity-100"
            >
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              Syncing with Alpaca market
            </Button>
          </GlowButtonFrame>
        ) : null}

        {synced ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            aria-live="polite"
          >
            <p className="font-heading text-[clamp(2.75rem,10vw,5rem)] leading-none tracking-[-0.055em] tabular-nums">
              {formatCash(ALPACA_AVAILABLE_CASH)}
            </p>
            <p className="mt-2 text-sm text-white/65">available in Alpaca portfolio</p>
            <div className="mt-6 inline-flex">
              <GlowButtonFrame>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 rounded-full border-0 bg-transparent px-5 text-white shadow-none hover:bg-[#0A2338]/35"
                >
                  Choose the mandate
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              </GlowButtonFrame>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.form>
  )
}

function RiskQuestion({
  reducedMotion,
  selected,
  onSelect,
  onContinue,
}: {
  reducedMotion: boolean
  selected: RiskLevel
  onSelect: (level: RiskLevel) => void
  onContinue: () => void
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onContinue()
  }

  return (
    <motion.form
      key="risk-level"
      initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-3xl"
    >
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text="How much risk should the portfolio take?"
      />

      <div className="mt-8 grid grid-cols-7 gap-2" role="radiogroup" aria-label="Risk level from 1 to 7">
        {RISK_LEVELS.map((level, index) => {
          const active = selected === level

          return (
            <motion.button
              key={level}
              type="button"
              role="radio"
              aria-checked={active}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : index * 0.04, duration: reducedMotion ? 0 : 0.24 }}
              onClick={() => onSelect(level)}
              className={cn(
                "grid aspect-square place-items-center rounded-2xl border font-heading text-2xl transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#39BDD1]/30",
                active
                  ? "border-[#39BDD1] bg-[#12496E] text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              )}
            >
              {level}
            </motion.button>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-white/60">
        <span>Lower risk</span>
        <span>Higher risk</span>
      </div>

      <div className="mt-8 inline-flex">
        <GlowButtonFrame>
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-full border-0 bg-transparent px-5 text-white shadow-none hover:bg-[#0A2338]/35"
          >
            Choose markets
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </GlowButtonFrame>
      </div>
    </motion.form>
  )
}

function AssetQuestion({
  reducedMotion,
  selected,
  onContinue,
  onToggle,
}: {
  reducedMotion: boolean
  selected: readonly AssetClassId[]
  onContinue: () => void
  onToggle: (assetClass: AssetClassId) => void
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onContinue()
  }

  return (
    <motion.form
      key="assets"
      initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl"
    >
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text="What can the agents research?"
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Asset classes">
        {ASSET_CLASSES.map((assetClass, index) => {
          const active = selected.includes(assetClass.id)
          const Icon = assetClass.icon

          return (
            <motion.div
              key={assetClass.id}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : index * 0.07, duration: reducedMotion ? 0 : 0.28 }}
            >
              <BorderGlow
                backgroundColor={active ? "#0B2836" : "#071C28"}
                borderRadius={18}
                colors={SONAR_GLOW_COLORS}
                edgeSensitivity={20}
                fillOpacity={0.2}
                glowColor="193 63 55"
                glowIntensity={0.65}
                glowRadius={22}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => onToggle(assetClass.id)}
                  className="flex w-full items-center gap-3 rounded-[17px] bg-transparent p-4 text-left text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#39BDD1]/30"
                >
                  <span className={cn(
                    "grid size-9 place-items-center rounded-full",
                    active ? "bg-[#39BDD1] text-[#06182F]" : "bg-white/10 text-white/55"
                  )}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 font-heading text-lg tracking-[-0.02em]">
                    {assetClass.label}
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border transition-colors",
                      active ? "border-[#39BDD1] bg-[#39BDD1] text-[#06182F]" : "border-white/25 text-transparent"
                    )}
                    aria-hidden="true"
                  >
                    <Check className="size-3" />
                  </span>
                </button>
              </BorderGlow>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 inline-flex">
        <GlowButtonFrame>
          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-full border-0 bg-transparent px-5 text-white shadow-none hover:bg-[#0A2338]/35"
          >
            Lock paper mandate
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </GlowButtonFrame>
      </div>
    </motion.form>
  )
}

function ResearchSequence({
  reducedMotion,
  onComplete,
}: {
  reducedMotion: boolean
  onComplete: () => void
}) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (reducedMotion) {
      onComplete()
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextMessageIndex = Math.min(
        Math.floor(elapsed / THINKING_MESSAGE_DURATION_MS),
        THINKING_MESSAGES.length - 1,
      )
      setMessageIndex(nextMessageIndex)

      if (elapsed >= RESEARCH_DURATION_MS) {
        window.clearInterval(interval)
        onComplete()
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [onComplete, reducedMotion])

  return (
    <motion.div
      key="researching"
      initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative -top-6 flex w-full max-w-2xl flex-col items-center justify-center"
    >
      <motion.div
        className="text-white/60"
        role="status"
        aria-label="Agents are working"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 1.1, repeat: Infinity, ease: "linear" }
        }
      >
        <LoaderCircle className="size-6" aria-hidden="true" />
      </motion.div>
      <div className="mt-5 flex min-h-6 items-center justify-center text-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={THINKING_MESSAGES[messageIndex]}
            aria-live="polite"
            initial={reducedMotion ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-base font-medium tracking-[-0.01em] text-white/65"
          >
            {THINKING_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function OnboardingIntro() {
  const reducedMotion = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<IntroStage>({ kind: "arriving" })
  const [name, setName] = useState("")
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(DEFAULT_RISK_LEVEL)
  const [assetClasses, setAssetClasses] = useState<AssetClassId[]>([
    "stocks",
    "etfs",
    "crypto",
  ])
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (stage.kind === "asking-name") {
      inputRef.current?.focus()
    }
  }, [stage.kind])

  useEffect(() => {
    if (stage.kind !== "acknowledging") return

    const delay = reducedMotion ? 450 : 1_800
    const displayName = stage.displayName
    const timeout = window.setTimeout(() => {
      setStage({ kind: "asking-alpaca", displayName })
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [reducedMotion, stage])

  function finishArrival() {
    setStage((currentStage) =>
      currentStage.kind === "arriving"
        ? { kind: "asking-name" }
        : currentStage
    )
  }

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = name.trim()
    if (!normalizedName) {
      setHasError(true)
      inputRef.current?.focus()
      return
    }

    setHasError(false)
    storeValue(DISPLAY_NAME_KEY, normalizedName)
    setStage({ kind: "acknowledging", displayName: normalizedName })
  }

  function continueFromAlpaca() {
    if (stage.kind !== "asking-alpaca") return

    storeValue(ALPACA_CASH_KEY, String(ALPACA_AVAILABLE_CASH))
    setStage({ kind: "asking-risk", displayName: stage.displayName, budget: ALPACA_AVAILABLE_CASH })
  }

  function continueFromRisk() {
    if (stage.kind !== "asking-risk") return

    storeValue(RISK_LEVEL_KEY, String(riskLevel))
    setStage({
      kind: "asking-assets",
      displayName: stage.displayName,
      budget: stage.budget,
      riskLevel,
    })
  }

  function toggleAssetClass(assetClass: AssetClassId) {
    setAssetClasses((currentAssetClasses) => {
      if (!currentAssetClasses.includes(assetClass)) {
        return [...currentAssetClasses, assetClass]
      }

      if (currentAssetClasses.length === 1) {
        return currentAssetClasses
      }

      return currentAssetClasses.filter((currentAssetClass) => currentAssetClass !== assetClass)
    })
  }

  function completeMandate() {
    if (stage.kind !== "asking-assets") return

    storeValue(ASSET_CLASSES_KEY, JSON.stringify(assetClasses))
    setStage({
      kind: "researching",
      displayName: stage.displayName,
      budget: stage.budget,
      riskLevel: stage.riskLevel,
      assetClasses,
    })
  }

  function finishResearch() {
    if (stage.kind !== "researching") return

    setStage({
      kind: "complete",
      displayName: stage.displayName,
      budget: stage.budget,
      riskLevel: stage.riskLevel,
      assetClasses: stage.assetClasses,
    })
  }

  const compactOrb =
    stage.kind === "asking-alpaca" ||
    stage.kind === "asking-risk" ||
    stage.kind === "asking-assets" ||
    stage.kind === "researching" ||
    stage.kind === "complete"

  return (
    <main className="dark relative isolate min-h-svh overflow-x-hidden bg-[#020817] text-white">
      <ShaderGradient
        colors={SONAR_DARK_GRADIENT}
        speed={0.045}
        blur={0.9}
        intensity={0.72}
        interactive={stage.kind !== "arriving"}
        theme="dark"
      />

      <section
        aria-label="Introduction"
        className="relative z-10 flex min-h-svh items-center justify-center px-5 py-10 sm:px-6 sm:py-12"
      >
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={
              reducedMotion
                ? false
                : { y: "48vh", scale: 0.82, opacity: 0 }
            }
            animate={{
              y: compactOrb ? -8 : 0,
              scale: compactOrb ? 0.72 : stage.kind === "acknowledging" ? 1.02 : 1,
              opacity: 1,
            }}
            transition={
              stage.kind === "arriving"
                ? { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
                : { duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }
            }
            onAnimationComplete={finishArrival}
            className={cn(
              "drop-shadow-[0_28px_42px_rgba(18,73,110,0.2)]",
              compactOrb && "-mb-7"
            )}
          >
            <LiveOrb
              size={224}
              variant="white"
              interactive={stage.kind !== "arriving"}
            />
          </motion.div>

          <div
            className={cn(
              "mt-9 flex w-full items-start justify-center transition-[min-height] duration-300",
              stage.kind === "asking-name" || stage.kind === "acknowledging"
                ? "min-h-14"
                : "min-h-[24rem]"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {stage.kind === "asking-name" ? (
                <motion.form
                  key="name-greeting"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={
                    hasError && !reducedMotion
                      ? { opacity: 1, x: [0, -5, 5, -3, 3, 0] }
                      : { opacity: 1, x: 0 }
                  }
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reducedMotion ? 0 : 0.24 }}
                  onSubmit={handleNameSubmit}
                  noValidate
                  className="w-full"
                >
                  <h1 className="flex min-h-12 items-baseline justify-center font-heading text-[clamp(1.75rem,6vw,2.5rem)] font-normal tracking-[-0.045em]">
                    <AnimatedGreeting reducedMotion={reducedMotion} />
                    <motion.span
                      initial={
                        reducedMotion
                          ? false
                          : { opacity: 0, y: 6, filter: "blur(5px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        delay: reducedMotion ? 0 : 0.34,
                        duration: reducedMotion ? 0 : 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-flex items-baseline"
                    >
                      <span aria-hidden="true">&nbsp;</span>
                      <label htmlFor="display-name" className="sr-only">
                        Your name
                      </label>
                      <Input
                        ref={inputRef}
                        id="display-name"
                        name="displayName"
                        type="text"
                        autoComplete="name"
                        maxLength={24}
                        size={4}
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value)
                          if (hasError) setHasError(false)
                        }}
                        aria-invalid={hasError}
                        placeholder="name"
                        style={{
                          fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
                          lineHeight: 1,
                        }}
                        className="field-sizing-content h-auto min-w-[4ch] max-w-[14ch] rounded-none border-0 bg-transparent px-0 py-0 text-left font-heading text-white tracking-[-0.045em] shadow-none placeholder:text-white/40 focus-visible:ring-0"
                      />
                      <span aria-hidden="true">!</span>
                    </motion.span>
                  </h1>
                  <button type="submit" className="sr-only">
                    Save name
                  </button>
                  <p role="alert" className="sr-only">
                    {hasError ? "Enter your name to continue." : ""}
                  </p>
                </motion.form>
              ) : null}

              {stage.kind === "acknowledging" ? (
                <motion.div
                  key="name-acknowledgement"
                  initial={
                    reducedMotion
                      ? false
                      : { opacity: 0, y: 8, filter: "blur(5px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-flex"
                >
                  <BorderGlow
                    animated
                    backgroundColor="#0B2836"
                    borderRadius={999}
                    colors={SONAR_GLOW_COLORS}
                    coneSpread={30}
                    edgeSensitivity={16}
                    fillOpacity={0.24}
                    glowColor="193 63 55"
                    glowIntensity={0.75}
                    glowRadius={30}
                  >
                    <h1 className="px-7 py-3 text-balance font-heading text-[clamp(1.75rem,6vw,2.5rem)] font-normal tracking-[-0.045em]">
                      Hello, {stage.displayName}!
                    </h1>
                  </BorderGlow>
                </motion.div>
              ) : null}

              {stage.kind === "asking-alpaca" ? (
                <AlpacaConnectionQuestion
                  key="alpaca-question"
                  reducedMotion={reducedMotion}
                  onContinue={continueFromAlpaca}
                />
              ) : null}

              {stage.kind === "asking-risk" ? (
                <RiskQuestion
                  key="risk-level-question"
                  reducedMotion={reducedMotion}
                  selected={riskLevel}
                  onSelect={setRiskLevel}
                  onContinue={continueFromRisk}
                />
              ) : null}

              {stage.kind === "asking-assets" ? (
                <AssetQuestion
                  key="asset-question"
                  reducedMotion={reducedMotion}
                  selected={assetClasses}
                  onContinue={completeMandate}
                  onToggle={toggleAssetClass}
                />
              ) : null}

              {stage.kind === "complete" ? (
                <motion.div
                  key="complete"
                  initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  <span className="mx-auto grid size-8 place-items-center rounded-full bg-[#39BDD1] text-[#06182F]">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <AnimatedQuestion
                    className="mt-4 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] tracking-[-0.045em]"
                    reducedMotion={reducedMotion}
                    text="Your paper mandate is ready."
                  />
                  <p className="mt-3 text-sm text-white/65">
                    {formatCash(stage.budget)} · risk {stage.riskLevel}/7 · {stage.assetClasses.length} markets
                  </p>
                  <div className="mt-7 inline-flex">
                    <GlowButtonFrame>
                      <Button
                        render={<Link href="/saloon" />}
                        nativeButton={false}
                        size="lg"
                        className="h-11 rounded-full border-0 bg-transparent px-5 text-white shadow-none hover:bg-[#0A2338]/35"
                      >
                        Enter the Saloon
                        <ArrowRight data-icon="inline-end" aria-hidden="true" />
                      </Button>
                    </GlowButtonFrame>
                  </div>
                </motion.div>
              ) : null}

              {stage.kind === "researching" ? (
                <ResearchSequence
                  reducedMotion={reducedMotion}
                  onComplete={finishResearch}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}
