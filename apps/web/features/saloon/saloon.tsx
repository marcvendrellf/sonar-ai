"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Gauge, Info, Pause, Play, Radar, RotateCcw, SkipForward } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { AgentInterviewPanel } from "./agent-interview-panel"
import { AgentRoster, AgentStateBadge } from "./agent-roster"
import { EvidencePanel } from "./evidence-panel"
import { ReceiptQuestions } from "./receipt-qa"
import { ReceiptSheet, SourceSheet } from "./saloon-sheets"
import { SaloonScene } from "./saloon-scene"
import { agents, kindLabels, pathNodes, type AgentId, type TraceEntry } from "./run-fixture"
import { SPEEDS, useSaloonRun, type SaloonRun, type Speed } from "./use-saloon-run"

const agentName = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]))

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

function RunTimeline({
  entries,
  cursor,
  onJump,
}: {
  entries: readonly TraceEntry[]
  cursor: number
  onJump: (cursor: number) => void
}) {
  return (
    <div
      className="flex items-end gap-px px-4 pb-2"
      role="group"
      aria-label="Run timeline. Select an event to scrub to it."
    >
      {entries.map((entry, index) => {
        const happened = index < cursor
        const isCurrent = index === cursor - 1
        return (
          <button
            key={entry.id}
            type="button"
            data-agent={entry.agent}
            onClick={() => onJump(index + 1)}
            title={`${entry.clock} · ${agentName[entry.agent]} · ${entry.text}`}
            aria-label={`${entry.clock}, ${agentName[entry.agent]}, ${kindLabels[entry.kind]}`}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "saloon-agent saloon-tone-rail flex-1 rounded-[2px] transition-[opacity,height] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              entry.kind === "checkpoint" || entry.kind === "gate" ? "h-5" : "h-2.5",
              happened ? "opacity-90" : "opacity-15 hover:opacity-40",
              isCurrent && "opacity-100 ring-1 ring-foreground/20"
            )}
          />
        )
      })}
    </div>
  )
}

function RunControls({ run }: { run: SaloonRun }) {
  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(run.speed) + 1) % SPEEDS.length] as Speed
    run.setSpeed(next)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 font-mono text-xs tabular-nums text-muted-foreground">{run.clock}</span>
      <Button variant="ghost" size="icon-sm" onClick={run.restart} aria-label="Restart the run">
        <RotateCcw aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={run.toggle}
        aria-label={run.playing ? "Pause the run" : "Play the run"}
      >
        {run.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={run.finish}
        disabled={run.done}
        aria-label="Skip to the end of the run"
      >
        <SkipForward aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleSpeed}
        aria-label={`Playback speed ${run.speed} times`}
      >
        <Gauge data-icon="inline-start" aria-hidden="true" />
        {run.speed}×
      </Button>
    </div>
  )
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
          3D room unavailable · seated roster
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
  onOpenSource,
  onOpenReceipt,
}: {
  run: SaloonRun
  selected: AgentId | null
  onSelect: (id: AgentId) => void
  onOpenSource: (id: string) => void
  onOpenReceipt: () => void
}) {
  const latest = run.visible.at(-1)

  return (
    <div>
      <div className="border-b p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest event</p>
        {latest ? (
          <>
            <p className="mt-1 text-sm leading-6">{latest.text}</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {latest.clock} · {agentName[latest.agent]} · {kindLabels[latest.kind]}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">The room is waiting for the event.</p>
        )}
      </div>

      <div className="border-b p-4">
        <AgentRoster runtime={run.runtime} selected={selected} onSelect={onSelect} />
        <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
          Select an agent here or at the table to open the interview view.
        </p>
      </div>

      <EvidencePanel
        revealed={run.revealed}
        readSources={run.readSources}
        checks={run.checks}
        receiptReady={run.receiptReady}
        onOpenSource={onOpenSource}
        onOpenReceipt={onOpenReceipt}
      />

      <div className="border-t p-4">
        <h3 className="mb-3 text-sm font-medium">Ask the receipt</h3>
        <ReceiptQuestions enabled={run.receiptReady} />
      </div>
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
  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const urlAgent = React.useSyncExternalStore(noSubscribe, agentFromUrl, () => null)
  const webgl = React.useSyncExternalStore(noSubscribe, detectWebgl, () => null)

  const selected = chosen === undefined ? urlAgent : chosen

  const select = React.useCallback((id: AgentId | null) => {
    setChosen(id)
    // The details Sheet is the compact-viewport home for the panel. On wide
    // viewports the panel is always on screen, so selection must not open it.
    const compact = window.matchMedia("(max-width: 1023px)").matches
    setDetailsOpen(compact && id !== null)
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
  const openReceipt = React.useCallback(() => setReceiptOpen(true), [])

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
    <TablePanel
      run={run}
      selected={selected}
      onSelect={select}
      onOpenSource={openSource}
      onOpenReceipt={openReceipt}
    />
  )

  return (
    <div className="saloon-root flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--sonar-navy)]"
              aria-hidden="true"
            >
              <Radar className="size-4 text-[var(--sonar-cyan)]" />
            </span>
            <div>
              <h1 className="font-heading text-sm font-semibold tracking-tight">The Saloon</h1>
              <p className="font-mono text-[11px] text-muted-foreground">
                EV-104 · export-control replay
              </p>
            </div>
            <Badge variant="outline" className="ml-1 hidden sm:inline-flex">
              {run.done ? "Run complete" : run.playing ? "Running" : "Paused"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
              <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
                <Info data-icon="inline-start" aria-hidden="true" />
                Details
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-sm">
                <SheetHeader className="border-b">
                  <SheetTitle>{selectedAgent ? selectedAgent.name : "The room"}</SheetTitle>
                </SheetHeader>
                {panel}
              </SheetContent>
            </Sheet>
            <RunControls run={run} />
          </div>
        </div>

        <RunTimeline entries={run.entries} cursor={run.cursor} onJump={run.jumpTo} />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative min-h-0">
          {webgl === false ? (
            <StaticTable runtime={run.runtime} selected={selected} onSelect={select} />
          ) : webgl ? (
            <SaloonScene
              runtime={run.runtime}
              selected={selected}
              pathProgress={run.revealed.length / pathNodes.length}
              reduceMotion={reduceMotion}
              onSelect={select}
            />
          ) : null}

          <p className="saloon-canvas-hint pointer-events-none absolute bottom-3 left-4 text-[11px]">
            {selected
              ? "Escape or the back action returns to the table."
              : "Select an agent orb to move the camera into the interview view."}
          </p>
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
      <ReceiptSheet open={receiptOpen} onOpenChange={setReceiptOpen} checks={run.checks} />
    </div>
  )
}
