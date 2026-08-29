"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Bitcoin, ChartNoAxesCombined, Check, Layers3 } from "lucide-react"

import { BorderGlow } from "@/components/border-glow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LiveOrb } from "@/components/ui/live-orb"
import { ShaderGradient } from "@/components/ui/shader-gradient"
import { cn } from "@/lib/utils"

type RiskProfileId = "tight" | "core" | "wide"
type AssetClassId = "stocks" | "etfs" | "crypto"

type IntroStage =
  | { kind: "arriving" }
  | { kind: "asking-name" }
  | { kind: "acknowledging"; displayName: string }
  | { kind: "asking-baseline"; displayName: string }
  | { kind: "asking-risk"; displayName: string; budget: number }
  | {
      kind: "asking-assets"
      displayName: string
      budget: number
      riskProfile: RiskProfileId
    }
  | {
      kind: "complete"
      displayName: string
      budget: number
      riskProfile: RiskProfileId
      assetClasses: readonly AssetClassId[]
    }

const DISPLAY_NAME_KEY = "sonar-ai.display-name"
const PAPER_BUDGET_KEY = "sonar-ai.paper-budget"
const RISK_PROFILE_KEY = "sonar-ai.risk-profile"
const ASSET_CLASSES_KEY = "sonar-ai.asset-classes"
const GREETING_CHARACTERS = ["H", "i", ","] as const
const SONAR_LIGHT_GRADIENT = ["#D9E8EF", "#8FBED2", "#3F87A8"]
const SONAR_GLOW_COLORS = ["#8FBED2", "#39BDD1", "#D9E8EF"]
const PAPER_BASELINE = 1_000

const RISK_PROFILES = [
  {
    id: "tight",
    label: "Tight mandate",
    recommended: false,
    rules: [
      { value: "20%", label: "Max position" },
      { value: "35%", label: "Max sector" },
      { value: "20%", label: "Min cash" },
      { value: "10%", label: "Max turnover" },
    ],
  },
  {
    id: "core",
    label: "Core mandate",
    recommended: true,
    rules: [
      { value: "30%", label: "Max position" },
      { value: "45%", label: "Max sector" },
      { value: "10%", label: "Min cash" },
      { value: "20%", label: "Max turnover" },
    ],
  },
  {
    id: "wide",
    label: "Wide sandbox",
    recommended: false,
    rules: [
      { value: "40%", label: "Max position" },
      { value: "60%", label: "Max sector" },
      { value: "5%", label: "Min cash" },
      { value: "30%", label: "Max turnover" },
    ],
  },
] as const satisfies ReadonlyArray<{
  id: RiskProfileId
  label: string
  recommended: boolean
  rules: ReadonlyArray<{ value: string; label: string }>
}>

const ASSET_CLASSES = [
  { id: "stocks", label: "U.S. stocks", icon: ChartNoAxesCombined },
  { id: "etfs", label: "ETFs", icon: Layers3 },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
] as const satisfies ReadonlyArray<{
  id: AssetClassId
  label: string
  icon: typeof ChartNoAxesCombined
}>

const capitalFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

function storeValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Onboarding remains usable when storage is unavailable.
  }
}

function formatCapital(value: number) {
  return capitalFormatter.format(value)
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

function BaselineQuestion({
  displayName,
  reducedMotion,
  onContinue,
}: {
  displayName: string
  reducedMotion: boolean
  onContinue: () => void
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onContinue()
  }

  return (
    <motion.form
      key="baseline"
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl"
    >
      <p className="text-xs font-medium tracking-[0.2em] text-[#12496E]/65 uppercase">
        Paper baseline
      </p>
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text={`Your fund starts with ${formatCapital(PAPER_BASELINE)}, ${displayName}.`}
      />
      <p className="mt-3 text-sm text-[#12496E]/65">
        100% cash · 0% invested
      </p>

      <motion.p
        initial={reducedMotion ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: reducedMotion ? 0 : 0.35, duration: reducedMotion ? 0 : 0.36 }}
        className="mt-7 font-heading text-[clamp(2.75rem,10vw,5rem)] leading-none tracking-[-0.055em] tabular-nums"
      >
        {formatCapital(PAPER_BASELINE)}
      </motion.p>

      <div className="mt-8 inline-flex">
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
    </motion.form>
  )
}

function RiskQuestion({
  selected,
  reducedMotion,
  onSelect,
  onContinue,
}: {
  selected: RiskProfileId
  reducedMotion: boolean
  onSelect: (profile: RiskProfileId) => void
  onContinue: () => void
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onContinue()
  }

  return (
    <motion.form
      key="risk"
      initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-3xl"
    >
      <p className="text-xs font-medium tracking-[0.2em] text-[#12496E]/65 uppercase">
        Risk profile
      </p>
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text="How much room should the agents have?"
      />
      <p className="mt-3 text-sm text-[#12496E]/65">
        The code enforces every limit.
      </p>

      <div className="mt-7 grid gap-3 text-left sm:grid-cols-3" role="radiogroup" aria-label="Risk profile">
        {RISK_PROFILES.map((profile, index) => {
          const active = selected === profile.id
          return (
            <motion.div
              key={profile.id}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : index * 0.07, duration: reducedMotion ? 0 : 0.28 }}
              className="h-full"
            >
              <BorderGlow
                backgroundColor={active ? "#EFF8FA" : "#F4F9FA"}
                borderRadius={20}
                className="h-full"
                colors={SONAR_GLOW_COLORS}
                edgeSensitivity={20}
                fillOpacity={0.22}
                glowColor="193 63 55"
                glowIntensity={0.65}
                glowRadius={24}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelect(profile.id)}
                  className={cn(
                    "relative h-full w-full rounded-[19px] p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#12496E]/25",
                    active ? "bg-white/30" : "bg-transparent hover:bg-white/20"
                  )}
                >
                  <span className="flex min-h-8 items-start justify-between gap-3">
                    <span>
                      <span className="block font-heading text-xl tracking-[-0.025em]">{profile.label}</span>
                      {profile.recommended ? (
                        <span className="mt-1 block text-[10px] font-semibold tracking-[0.12em] text-[#12496E]/55 uppercase">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                        active ? "border-[#12496E] bg-[#12496E] text-white" : "border-[#12496E]/25 text-transparent"
                      )}
                      aria-hidden="true"
                    >
                      <Check className="size-3" />
                    </span>
                  </span>
                  <span className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
                    {profile.rules.map((rule) => (
                      <span key={rule.label}>
                        <span className="block font-heading text-2xl leading-none tracking-[-0.04em]">{rule.value}</span>
                        <span className="mt-1 block text-[10px] font-medium text-[#12496E]/55">{rule.label}</span>
                      </span>
                    ))}
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
      <p className="text-xs font-medium tracking-[0.2em] text-[#12496E]/65 uppercase">
        Research universe
      </p>
      <AnimatedQuestion
        className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]"
        reducedMotion={reducedMotion}
        text="What can the agents research?"
      />
      <p className="mt-3 text-sm text-[#12496E]/65">
        All markets are selected. Keep at least one.
      </p>

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
                backgroundColor={active ? "#EFF8FA" : "#F4F9FA"}
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
                  className="flex w-full items-center gap-3 rounded-[17px] bg-transparent p-4 text-left transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#12496E]/25"
                >
                  <span className={cn(
                    "grid size-9 place-items-center rounded-full",
                    active ? "bg-[#12496E] text-white" : "bg-[#D9E8EF] text-[#12496E]/55"
                  )}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 font-heading text-lg tracking-[-0.02em]">
                    {assetClass.label}
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border transition-colors",
                      active ? "border-[#12496E] bg-[#12496E] text-white" : "border-[#12496E]/25 text-transparent"
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

export function OnboardingIntro() {
  const reducedMotion = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<IntroStage>({ kind: "arriving" })
  const [name, setName] = useState("")
  const [riskProfile, setRiskProfile] = useState<RiskProfileId>("core")
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
      setStage({ kind: "asking-baseline", displayName })
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

  function continueFromBaseline() {
    if (stage.kind !== "asking-baseline") return

    storeValue(PAPER_BUDGET_KEY, String(PAPER_BASELINE))
    setStage({
      kind: "asking-risk",
      displayName: stage.displayName,
      budget: PAPER_BASELINE,
    })
  }

  function continueFromRisk() {
    if (stage.kind !== "asking-risk") return

    storeValue(RISK_PROFILE_KEY, riskProfile)
    setStage({
      kind: "asking-assets",
      displayName: stage.displayName,
      budget: stage.budget,
      riskProfile,
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
      kind: "complete",
      displayName: stage.displayName,
      budget: stage.budget,
      riskProfile: stage.riskProfile,
      assetClasses,
    })
  }

  const compactOrb =
    stage.kind === "asking-baseline" ||
    stage.kind === "asking-risk" ||
    stage.kind === "asking-assets" ||
    stage.kind === "complete"
  const selectedProfile = RISK_PROFILES.find((profile) => profile.id === riskProfile)

  return (
    <main className="relative isolate min-h-svh overflow-x-hidden bg-[#D9E8EF] text-[#0A2338]">
      <ShaderGradient
        colors={SONAR_LIGHT_GRADIENT}
        speed={0.045}
        blur={0.9}
        intensity={0.72}
        interactive={stage.kind !== "arriving"}
        theme="light"
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
                        className="field-sizing-content h-auto min-w-[4ch] max-w-[14ch] rounded-none border-0 bg-transparent px-0 py-0 text-left font-heading text-[#0A2338] tracking-[-0.045em] shadow-none placeholder:text-[#0A2338]/40 focus-visible:ring-0"
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
                    backgroundColor="#EFF8FA"
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

              {stage.kind === "asking-baseline" ? (
                <BaselineQuestion
                  key="baseline-question"
                  displayName={stage.displayName}
                  reducedMotion={reducedMotion}
                  onContinue={continueFromBaseline}
                />
              ) : null}

              {stage.kind === "asking-risk" ? (
                <RiskQuestion
                  key="risk-question"
                  selected={riskProfile}
                  reducedMotion={reducedMotion}
                  onSelect={setRiskProfile}
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

              {stage.kind === "complete" && selectedProfile ? (
                <motion.div
                  key="complete"
                  initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  <span className="mx-auto grid size-8 place-items-center rounded-full bg-[#12496E] text-white">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <AnimatedQuestion
                    className="mt-4 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] tracking-[-0.045em]"
                    reducedMotion={reducedMotion}
                    text="Your paper mandate is ready."
                  />
                  <p className="mt-3 text-sm text-[#12496E]/65">
                    {formatCapital(stage.budget)} · {selectedProfile.label} · {stage.assetClasses.length} markets
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
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}
