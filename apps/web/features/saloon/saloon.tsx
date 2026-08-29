"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

import { AgentInterviewPanel } from "./agent-interview-panel"
import { AgentRoster, AgentStateBadge } from "./agent-roster"
import { SourceSheet } from "./saloon-sheets"
import { SaloonScene } from "./saloon-scene"
import { agents, type AgentId } from "./run-fixture"
import { useSaloonRun, type SaloonRun } from "./use-saloon-run"

const noSubscribe = () => () => {}

let webglSupport: boolean | null = null

function detectWebgl(): boolean {
  if (webglSupport === null) {
    try {
      const probe = document.createElement("canvas")
      webglSupport = Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

function agentFromUrl(): AgentId | null {
  const value = new URLSearchParams(window.location.search).get("agent")
  return agents.some((agent) => agent.id === value) ? (value as AgentId) : null
}

/** Shown when WebGL cannot initialise. Selection keeps working. */
function StaticTable({
  runtime,
  selected,
  onSelect,
}: {
  runtime: SaloonRun["runtime"]
  selected: AgentId | null
  onSelect: (id: AgentId) => void
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[var(--sonar-navy)] p-6 text-white">
        <p className="mb-4 text-xs uppercase tracking-wider text-white/50">
          3D scene unavailable · seated roster
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {agents.map((agent) => (
            <li key={agent.id}>
              <button
                type="button"
                onClick={() => onSelect(agent.id)}
                aria-pressed={selected === agent.id}
                className={cn(
                  "w-full rounded-xl border border-white/10 p-3 text-left transition-colors hover:bg-white/10",
                  selected === agent.id && "bg-white/10"
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{agent.name}</span>
                  <AgentStateBadge state={runtime[agent.id].state} />
                </span>
                <span className="mt-1 block text-xs text-white/60">Seat {agent.seat + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TablePanel({
  run,
  selected,
  onSelect,
}: {
  run: SaloonRun
  selected: AgentId | null
  onSelect: (id: AgentId) => void
}) {
  return (
    <div className="p-4">
      <AgentRoster runtime={run.runtime} selected={selected} onSelect={onSelect} />
    </div>
  )
}

export function Saloon() {
  const run = useSaloonRun()
  const reduceMotion = useReducedMotion() ?? false

  // Selection lives outside the canvas and in the URL, so a demo view is
  // reproducible. `undefined` means the user has not chosen yet, so the URL
  // still decides; both reads are client-only and null on the server.
  const [chosen, setChosen] = React.useState<AgentId | null | undefined>(undefined)
  const [sourceId, setSourceId] = React.useState<string | null>(null)

  const urlAgent = React.useSyncExternalStore(noSubscribe, agentFromUrl, () => null)
  const webgl = React.useSyncExternalStore(noSubscribe, detectWebgl, () => null)

  const selected = chosen === undefined ? urlAgent : chosen

  const select = React.useCallback((id: AgentId | null) => {
    setChosen(id)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set("agent", id)
    else url.searchParams.delete("agent")
    window.history.replaceState(null, "", url)
  }, [])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") select(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [select])

  const openSource = React.useCallback((id: string) => setSourceId(id), [])

  const selectedAgent = agents.find((agent) => agent.id === selected) ?? null
  const selectedRecords = React.useMemo(
    () => (selected ? run.visible.filter((entry) => entry.agent === selected) : []),
    [run.visible, selected]
  )

  const panel = selectedAgent ? (
    <AgentInterviewPanel
      agent={selectedAgent}
      runtime={run.runtime[selectedAgent.id]}
      records={selectedRecords}
      onOpenSource={openSource}
      onBack={() => select(null)}
    />
  ) : (
    <TablePanel run={run} selected={selected} onSelect={select} />
  )

  return (
    <div className="saloon-root flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative min-h-0">
          {webgl === false ? (
            <StaticTable runtime={run.runtime} selected={selected} onSelect={select} />
          ) : webgl ? (
            <SaloonScene
              selected={selected}
              reduceMotion={reduceMotion}
              onSelect={select}
            />
          ) : null}
        </div>

        <aside className="hidden min-h-0 overflow-y-auto border-l lg:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected ?? "table"}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              {panel}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      <SourceSheet sourceId={sourceId} onOpenChange={(open) => !open && setSourceId(null)} />
    </div>
  )
}
