"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AgentInterviewPanel } from "./agent-interview-panel"
import { AgentStateBadge } from "./agent-roster"
import { SaloonOverview } from "./saloon-overview"
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
  const agent = agents.find((candidate) => candidate.id === value)
  return agent?.id ?? null
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
                <span className="mt-1 block text-xs text-white/60">
                  Seat {agent.seat + 1}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SaloonRoom({ onClose }: { onClose: () => void }) {
  const run = useSaloonRun()
  const reduceMotion = useReducedMotion() ?? false

  // Selection is outside WebGL and reflected in the URL so the exact room
  // state can be replayed. The panel overlays the scene instead of resizing it.
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
      if (event.key !== "Escape") return
      if (selected) select(null)
      else onClose()
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, select, selected])

  const openSource = React.useCallback((id: string) => setSourceId(id), [])
  const selectedAgent = agents.find((agent) => agent.id === selected) ?? null
  const selectedRecords = React.useMemo(
    () => (selected ? run.visible.filter((entry) => entry.agent === selected) : []),
    [run.visible, selected]
  )

  return (
    <div className="saloon-root relative h-dvh w-dvw overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        {webgl === false ? (
          <StaticTable runtime={run.runtime} selected={selected} onSelect={select} />
        ) : webgl ? (
          <SaloonScene selected={selected} reduceMotion={reduceMotion} onSelect={select} />
        ) : null}
      </div>

      <Button
        className="absolute right-4 top-4 z-30"
        variant="outline"
        onClick={onClose}
      >
        Close room
      </Button>

      <AnimatePresence initial={false}>
        {selectedAgent ? (
          <motion.aside
            key={selectedAgent.id}
            className="absolute inset-y-0 right-0 z-20 w-1/2 overflow-y-auto border-l bg-background/95 pt-14 backdrop-blur"
            aria-label={`${selectedAgent.name} details`}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <AgentInterviewPanel
              agent={selectedAgent}
              runtime={run.runtime[selectedAgent.id]}
              records={selectedRecords}
              onOpenSource={openSource}
              onBack={() => select(null)}
            />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <SourceSheet
        sourceId={sourceId}
        onOpenChange={(open) => !open && setSourceId(null)}
      />
    </div>
  )
}

export function Saloon() {
  const [roomOpen, setRoomOpen] = React.useState(false)
  const reduceMotion = useReducedMotion() ?? false

  const openRoom = React.useCallback(() => setRoomOpen(true), [])
  const closeRoom = React.useCallback(() => setRoomOpen(false), [])

  React.useEffect(() => {
    if (!roomOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [roomOpen])

  return (
    <>
      <SaloonOverview onOpenRoom={openRoom} />
      <AnimatePresence>
        {roomOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            role="dialog"
            aria-modal="true"
            aria-label="Saloon room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SaloonRoom onClose={closeRoom} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
