"use client"

import * as React from "react"
import {
  Bell,
  Gauge,
  Info,
  Pause,
  Play,
  Radar,
  RotateCcw,
  SkipForward,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  CommitteeRoom,
  materialKinds,
  RoomInspector,
} from "./saloon-2d-board"
import { ReceiptSheet, SourceSheet } from "./saloon-sheets"
import { agents, kindLabels, type AgentId, type TraceEntry } from "./run-fixture"
import { SPEEDS, useSaloonRun, type SaloonRun } from "./use-saloon-run"

const noSubscribe = () => () => {}
const agentName = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]))

function agentFromUrl(): AgentId | null {
  const value = new URLSearchParams(window.location.search).get("agent")
  return agents.find((agent) => agent.id === value)?.id ?? null
}

function IconControl({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} {...props} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function RunControls({ run }: { run: SaloonRun }) {
  const cycleSpeed = () => {
    const nextIndex = (SPEEDS.indexOf(run.speed) + 1) % SPEEDS.length
    const next = SPEEDS[nextIndex]
    run.setSpeed(next)
  }

  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
        {run.clock}
      </span>
      <IconControl label="Restart the run" onClick={run.restart}>
        <RotateCcw aria-hidden="true" />
      </IconControl>
      <IconControl label={run.playing ? "Pause the run" : "Play the run"} onClick={run.toggle}>
        {run.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </IconControl>
      <IconControl label="Skip to the end" onClick={run.finish} disabled={run.done}>
        <SkipForward aria-hidden="true" />
      </IconControl>
      <Button variant="outline" size="sm" onClick={cycleSpeed} aria-label={`Playback speed ${run.speed} times`}>
        <Gauge data-icon="inline-start" aria-hidden="true" />
        {run.speed}×
      </Button>
    </div>
  )
}

function RunScrubber({ run }: { run: SaloonRun }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 pb-3" role="group" aria-label="Run timeline">
      {run.entries.map((entry, index) => {
        const happened = index < run.cursor
        const current = index === run.cursor - 1
        return (
          <Tooltip key={entry.id}>
            <TooltipTrigger
              render={
                <Button
                  variant={current ? "secondary" : "ghost"}
                  size="icon-xs"
                  onClick={() => run.jumpTo(index + 1)}
                  aria-label={`${entry.clock}, ${agentName[entry.agent]}, ${kindLabels[entry.kind]}`}
                  aria-current={current ? "step" : undefined}
                  className={cn("shrink-0", !happened && "opacity-35")}
                />
              }
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{entry.clock} · {entry.text}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function FindingsSheet({
  findings,
  readIds,
  open,
  onOpenChange,
  onSelect,
}: {
  findings: readonly TraceEntry[]
  readIds: ReadonlySet<string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (entry: TraceEntry) => void
}) {
  const unread = findings.filter((entry) => !readIds.has(entry.id)).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed right-4 bottom-4 rounded-full shadow-lg xl:right-[calc(390px+1rem)]"
            aria-label={`${unread} unread material findings`}
          />
        }
      >
        <Bell data-icon="inline-start" aria-hidden="true" />
        Findings
        {unread > 0 ? <Badge variant="secondary">{unread}</Badge> : null}
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Material findings</SheetTitle>
          <SheetDescription>
            Source-backed changes and deterministic results, newest first.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-7rem)]">
          <div className="flex flex-col gap-2 p-4">
            {findings.length > 0 ? findings.slice().reverse().map((entry) => (
              <Card key={entry.id} size="sm" className={cn(!readIds.has(entry.id) && "bg-muted/40")}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                    {agentName[entry.agent]}
                    <Badge variant="outline">{kindLabels[entry.kind]}</Badge>
                  </CardTitle>
                  <time className="font-mono text-[10px] text-muted-foreground">{entry.clock}</time>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-xs leading-5">{entry.text}</p>
                  <Button variant="outline" size="sm" onClick={() => onSelect(entry)}>
                    Inspect agent
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card size="sm" className="border-dashed">
                <CardContent className="py-3 text-sm text-muted-foreground">
                  No material finding has arrived yet.
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function Saloon() {
  const run = useSaloonRun()
  const [chosen, setChosen] = React.useState<AgentId | null | undefined>(undefined)
  const [sourceId, setSourceId] = React.useState<string | null>(null)
  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [findingsOpen, setFindingsOpen] = React.useState(false)
  const [readFindingIds, setReadFindingIds] = React.useState<ReadonlySet<string>>(() => new Set())

  const urlAgent = React.useSyncExternalStore(noSubscribe, agentFromUrl, () => null)
  const selected = chosen === undefined ? urlAgent : chosen
  const findings = React.useMemo(
    () => run.visible.filter((entry) => materialKinds.has(entry.kind)),
    [run.visible]
  )
  const unreadCount = findings.filter((entry) => !readFindingIds.has(entry.id)).length

  const select = React.useCallback((id: AgentId | null) => {
    setChosen(id)
    setDetailsOpen(window.matchMedia("(max-width: 1279px)").matches && id !== null)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set("agent", id)
    else url.searchParams.delete("agent")
    window.history.replaceState(null, "", url)
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") select(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [select])

  const changeDetailsOpen = React.useCallback((open: boolean) => {
    setDetailsOpen(open)
    if (!open && selected) select(null)
  }, [select, selected])

  const changeFindingsOpen = React.useCallback((open: boolean) => {
    setFindingsOpen(open)
    if (open) {
      setReadFindingIds((current) => new Set([...current, ...findings.map((entry) => entry.id)]))
    }
  }, [findings])

  const inspectFinding = React.useCallback((entry: TraceEntry) => {
    setReadFindingIds((current) => new Set([...current, entry.id]))
    setFindingsOpen(false)
    select(entry.agent)
  }, [select])

  const inspector = (
    <RoomInspector
      run={run}
      selected={selected}
      onSelectAgent={select}
      onClearSelection={() => select(null)}
      onOpenSource={setSourceId}
    />
  )

  return (
    <TooltipProvider>
      <div className="saloon-root flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header className="shrink-0 border-b bg-background/95">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
                <Radar />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-sm font-semibold tracking-tight">The Saloon</h1>
                  <Badge variant="secondary">2D backup</Badge>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">EV-104 · fixture committee run</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {run.done ? "Run complete" : run.playing ? "Running" : "Paused"}
              </Badge>
              <Sheet open={detailsOpen} onOpenChange={changeDetailsOpen}>
                <SheetTrigger render={<Button variant="outline" size="sm" className="xl:hidden" />}>
                  <Info data-icon="inline-start" aria-hidden="true" />
                  Details
                </SheetTrigger>
                <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Committee details</SheetTitle>
                    <SheetDescription>Inspect the selected agent and its material events.</SheetDescription>
                  </SheetHeader>
                  {inspector}
                </SheetContent>
              </Sheet>
              <RunControls run={run} />
            </div>
          </div>
          <RunScrubber run={run} />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px]">
          <ScrollArea className="min-h-0">
            <main className="min-h-full p-3 pb-20 sm:p-4 sm:pb-20">
              <CommitteeRoom
                run={run}
                selected={selected}
                onSelect={select}
                onOpenReceipt={() => setReceiptOpen(true)}
              />
            </main>
          </ScrollArea>
          <aside className="hidden min-h-0 overflow-hidden border-l xl:block">{inspector}</aside>
        </div>

        <p className="sr-only" aria-live="polite">
          {unreadCount > 0 ? `${unreadCount} unread material findings` : "No unread material findings"}
        </p>

        <FindingsSheet
          findings={findings}
          readIds={readFindingIds}
          open={findingsOpen}
          onOpenChange={changeFindingsOpen}
          onSelect={inspectFinding}
        />
        <SourceSheet sourceId={sourceId} onOpenChange={(open) => !open && setSourceId(null)} />
        <ReceiptSheet open={receiptOpen} onOpenChange={setReceiptOpen} checks={run.checks} />
      </div>
    </TooltipProvider>
  )
}
