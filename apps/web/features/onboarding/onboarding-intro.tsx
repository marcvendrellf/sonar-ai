"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LiveOrb } from "@/components/ui/live-orb"
import { ShaderGradient } from "@/components/ui/shader-gradient"
import { cn } from "@/lib/utils"

type RiskProfileId = "tight" | "core" | "wide"

type IntroStage =
  | { kind: "arriving" }
  | { kind: "asking-name" }
  | { kind: "acknowledging"; displayName: string }
  | { kind: "asking-budget"; displayName: string }
  | { kind: "asking-risk"; displayName: string; budget: number }
  | {
      kind: "complete"
      displayName: string
      budget: number
      riskProfile: RiskProfileId
    }

const DISPLAY_NAME_KEY = "sonar-ai.display-name"
const PAPER_BUDGET_KEY = "sonar-ai.paper-budget"
const RISK_PROFILE_KEY = "sonar-ai.risk-profile"
const GREETING_CHARACTERS = ["H", "i", ","] as const
const SONAR_LIGHT_GRADIENT = ["#D9E8EF", "#8FBED2", "#3F87A8"]
const PAPER_BUDGETS = [250_000, 500_000, 1_000_000, 2_500_000] as const

const RISK_PROFILES = [
  {
    id: "tight",
    label: "Tight mandate",
    description: "Lower concentration and more cash held back.",
    rules: ["20% position", "35% sector", "20% cash", "10% turnover"],
  },
  {
    id: "core",
    label: "Core mandate",
    description: "The recommended profile for the demo replay.",
    rules: ["30% position", "45% sector", "10% cash", "20% turnover"],
  },
  {
    id: "wide",
    label: "Wide sandbox",
    description: "More room to act, with deterministic checks intact.",
    rules: ["40% position", "60% sector", "5% cash", "30% turnover"],
  },
] as const satisfies ReadonlyArray<{
  id: RiskProfileId
  label: string
  description: string
  rules: readonly string[]
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

function BudgetQuestion({
  budget,
  displayName,
  reducedMotion,
  onBudgetChange,
  onContinue,
}: {
  budget: number
  displayName: string
  reducedMotion: boolean
  onBudgetChange: (budget: number) => void
  onContinue: () => void
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onContinue()
  }

  return (
    <motion.form
      key="budget"
      initial={reducedMotion ? false : { opacity: 0, y: 14, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl"
    >
      <p className="text-xs font-medium tracking-[0.2em] text-[#12496E]/65 uppercase">
        Paper budget
      </p>
      <h1 className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]">
        How much should Sonar manage, {displayName}?
      </h1>
      <p className="mt-3 text-sm text-[#12496E]/65">
        This is simulated capital for the paper fund.
      </p>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={budget}
          initial={reducedMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
          className="mt-7 font-heading text-[clamp(2.5rem,9vw,4.75rem)] leading-none tracking-[-0.055em] tabular-nums"
        >
          {formatCapital(budget)}
        </motion.p>
      </AnimatePresence>

      <label className="mx-auto mt-8 block max-w-xl">
        <span className="sr-only">Paper budget</span>
        <input
          type="range"
          min={250_000}
          max={2_500_000}
          step={50_000}
          value={budget}
          onChange={(event) => onBudgetChange(Number(event.target.value))}
          aria-valuetext={formatCapital(budget)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/55 accent-[#12496E] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#12496E]/25"
        />
        <span className="mt-2 flex justify-between text-[10px] font-medium tracking-wide text-[#12496E]/50">
          <span>€250K</span>
          <span>€2.5M</span>
        </span>
      </label>

      <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Paper budget presets">
        {PAPER_BUDGETS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onBudgetChange(value)}
            aria-pressed={budget === value}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#12496E]/25",
              budget === value
                ? "border-[#12496E] bg-[#12496E] text-white shadow-sm"
                : "border-[#12496E]/15 bg-white/30 text-[#12496E]/70 hover:border-[#12496E]/35 hover:bg-white/50 hover:text-[#12496E]"
            )}
          >
            {formatCapital(value)}
          </button>
        ))}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-8 h-11 rounded-full bg-[#12496E] px-5 text-white hover:bg-[#0A2338]"
      >
        Set risk profile
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
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
      <h1 className="mt-3 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] leading-[1.02] tracking-[-0.045em]">
        How much room should the agents have?
      </h1>
      <p className="mt-3 text-sm text-[#12496E]/65">
        Each profile maps to explicit deterministic limits—not model discretion.
      </p>

      <div className="mt-7 grid gap-3 text-left sm:grid-cols-3" role="radiogroup" aria-label="Risk profile">
        {RISK_PROFILES.map((profile, index) => {
          const active = selected === profile.id
          return (
            <motion.button
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(profile.id)}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : index * 0.07, duration: reducedMotion ? 0 : 0.28 }}
              className={cn(
                "relative rounded-2xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#12496E]/25",
                active
                  ? "border-[#12496E]/45 bg-white/65 shadow-[0_14px_36px_rgba(18,73,110,0.12)]"
                  : "border-white/45 bg-white/25 hover:border-white/75 hover:bg-white/40"
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-heading text-xl tracking-[-0.025em]">{profile.label}</span>
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
              <span className="mt-2 block min-h-10 text-xs leading-5 text-[#12496E]/60">
                {profile.description}
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                {profile.rules.map((rule) => (
                  <span key={rule} className="rounded-full bg-[#D9E8EF]/75 px-2 py-1 text-[10px] font-medium text-[#12496E]/70">
                    {rule}
                  </span>
                ))}
              </span>
            </motion.button>
          )
        })}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-8 h-11 rounded-full bg-[#12496E] px-5 text-white hover:bg-[#0A2338]"
      >
        Lock paper mandate
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </motion.form>
  )
}

export function OnboardingIntro() {
  const reducedMotion = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<IntroStage>({ kind: "arriving" })
  const [name, setName] = useState("")
  const [budget, setBudget] = useState(1_000_000)
  const [riskProfile, setRiskProfile] = useState<RiskProfileId>("core")
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (stage.kind === "asking-name") {
      inputRef.current?.focus()
    }
  }, [stage.kind])

  useEffect(() => {
    if (stage.kind !== "acknowledging") return

    const delay = reducedMotion ? 350 : 900
    const displayName = stage.displayName
    const timeout = window.setTimeout(() => {
      setStage({ kind: "asking-budget", displayName })
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

  function continueFromBudget() {
    if (stage.kind !== "asking-budget") return

    storeValue(PAPER_BUDGET_KEY, String(budget))
    setStage({
      kind: "asking-risk",
      displayName: stage.displayName,
      budget,
    })
  }

  function completeMandate() {
    if (stage.kind !== "asking-risk") return

    storeValue(RISK_PROFILE_KEY, riskProfile)
    setStage({
      kind: "complete",
      displayName: stage.displayName,
      budget: stage.budget,
      riskProfile,
    })
  }

  const compactOrb = stage.kind === "asking-budget" || stage.kind === "asking-risk" || stage.kind === "complete"
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
                <motion.h1
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
                  className="text-balance font-heading text-[clamp(1.75rem,6vw,2.5rem)] font-normal tracking-[-0.045em]"
                >
                  Hi, {stage.displayName}!
                </motion.h1>
              ) : null}

              {stage.kind === "asking-budget" ? (
                <BudgetQuestion
                  key="budget-question"
                  budget={budget}
                  displayName={stage.displayName}
                  reducedMotion={reducedMotion}
                  onBudgetChange={setBudget}
                  onContinue={continueFromBudget}
                />
              ) : null}

              {stage.kind === "asking-risk" ? (
                <RiskQuestion
                  key="risk-question"
                  selected={riskProfile}
                  reducedMotion={reducedMotion}
                  onSelect={setRiskProfile}
                  onContinue={completeMandate}
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
                  <h1 className="mt-4 text-balance font-heading text-[clamp(2rem,6vw,3.25rem)] tracking-[-0.045em]">
                    Your paper mandate is ready.
                  </h1>
                  <p className="mt-3 text-sm text-[#12496E]/65">
                    {formatCapital(stage.budget)} · {selectedProfile.label}
                  </p>
                  <Button
                    render={<Link href="/saloon" />}
                    nativeButton={false}
                    size="lg"
                    className="mt-7 h-11 rounded-full bg-[#12496E] px-5 text-white hover:bg-[#0A2338]"
                  >
                    Enter the Saloon
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  )
}
