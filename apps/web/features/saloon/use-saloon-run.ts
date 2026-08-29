"use client"

import * as React from "react"

import {
  agents,
  trace,
  type AgentId,
  type AgentState,
  type PathNodeId,
  type RiskCheck,
  type TraceEntry,
} from "./run-fixture"

const SPEEDS = [1, 2, 4] as const

export type Speed = (typeof SPEEDS)[number]

export type AgentRuntime = {
  state: AgentState
  task: string
  sources: number
  edges: number
  claims: number
  checks: number
  orders: number
}

export type SaloonRun = {
  entries: readonly TraceEntry[]
  visible: readonly TraceEntry[]
  cursor: number
  total: number
  playing: boolean
  done: boolean
  speed: Speed
  clock: string
  runtime: Record<AgentId, AgentRuntime>
  revealed: readonly PathNodeId[]
  checks: readonly RiskCheck[]
  readSources: readonly string[]
  receiptReady: boolean
  toggle: () => void
  restart: () => void
  jumpTo: (cursor: number) => void
  finish: () => void
  setSpeed: (speed: Speed) => void
}

const idleRuntime = (): Record<AgentId, AgentRuntime> =>
  Object.fromEntries(
    agents.map((agent) => [
      agent.id,
      {
        state: "idle" as AgentState,
        task: agent.idleTask,
        sources: 0,
        edges: 0,
        claims: 0,
        checks: 0,
        orders: 0,
      },
    ])
  ) as Record<AgentId, AgentRuntime>

/**
 * Playback engine for the lab. `cursor` is the number of trace entries that
 * have happened. Everything else in the Saloon is a fold over that prefix, so
 * scrubbing backwards rebuilds the whole room from the log.
 */
export function useSaloonRun(entries: readonly TraceEntry[] = trace): SaloonRun {
  const [cursor, setCursor] = React.useState(0)
  const [requestedPlaying, setPlaying] = React.useState(true)
  const [speed, setSpeed] = React.useState<Speed>(1)

  const total = entries.length
  const done = cursor >= total
  // A finished run is never playing, so the end of the trace stops playback
  // without an effect writing state back into React.
  const playing = requestedPlaying && !done

  React.useEffect(() => {
    if (!playing || done) return

    const previous = cursor > 0 ? entries[cursor - 1].at : entries[0].at - 1200
    const gap = entries[cursor].at - previous
    const delay = Math.min(1400, Math.max(220, gap / 4)) / speed

    const timer = window.setTimeout(() => setCursor((value) => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [cursor, done, entries, playing, speed])

  const visible = React.useMemo(() => entries.slice(0, cursor), [cursor, entries])

  const derived = React.useMemo(() => {
    const runtime = idleRuntime()
    const revealed: PathNodeId[] = []
    const checks: RiskCheck[] = []
    const readSources: string[] = []

    for (const entry of visible) {
      if (entry.states) {
        for (const [id, state] of Object.entries(entry.states)) {
          runtime[id as AgentId].state = state as AgentState
        }
      }
      if (entry.task) runtime[entry.agent].task = entry.task

      const counters = runtime[entry.agent]
      if (entry.kind === "source") counters.sources += 1
      if (entry.kind === "relationship") counters.edges += 1
      if (entry.kind === "claim" || entry.kind === "contradiction") counters.claims += 1
      if (entry.kind === "risk") counters.checks += 1
      if (entry.kind === "trade") counters.orders += 1

      if (entry.reveals && !revealed.includes(entry.reveals)) revealed.push(entry.reveals)
      if (entry.check) checks.push(entry.check)
      if (entry.source && !readSources.includes(entry.source)) readSources.push(entry.source)
    }

    return { runtime, revealed, checks, readSources }
  }, [visible])

  const clock = cursor > 0 ? entries[cursor - 1].clock : "09:42:00"
  const receiptReady = visible.some((entry) => entry.kind === "trade")

  const toggle = React.useCallback(() => {
    setPlaying((value) => {
      if (!value && cursor >= total) {
        setCursor(0)
        return true
      }
      return !value
    })
  }, [cursor, total])

  const restart = React.useCallback(() => {
    setCursor(0)
    setPlaying(true)
  }, [])

  const jumpTo = React.useCallback(
    (next: number) => {
      setPlaying(false)
      setCursor(Math.max(0, Math.min(total, next)))
    },
    [total]
  )

  const finish = React.useCallback(() => {
    setPlaying(false)
    setCursor(total)
  }, [total])

  return {
    entries,
    visible,
    cursor,
    total,
    playing,
    done,
    speed,
    clock,
    runtime: derived.runtime,
    revealed: derived.revealed,
    checks: derived.checks,
    readSources: derived.readSources,
    receiptReady,
    toggle,
    restart,
    jumpTo,
    finish,
    setSpeed,
  }
}

export { SPEEDS }
