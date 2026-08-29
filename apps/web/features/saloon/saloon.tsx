"use client"

import * as React from "react"
import { Bell, Pause, Play, Radar, ReceiptText, RotateCcw } from "lucide-react"

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

import { AgentDetails, AgentStage, materialKinds } from "./saloon-2d-board"
import { ReceiptSheet, SourceSheet } from "./saloon-sheets"
import {
  agents,
  kindLabels,
  type AgentId,
  type AgentState,
  type TraceEntry,
} from "./run-fixture"
import { useSaloonRun, type SaloonRun } from "./use-saloon-run"

const noSubscribe = () => () => {}
const agentName = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]))
const activeStates: ReadonlySet<AgentState> = new Set([
  "reading",
  "tracing",
  "debating",
  "checking-risk",
  "executing",
])

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
  return (
    <div className="flex items-center gap-1">
      <IconControl label="Restart the run" onClick={run.restart}>
        <RotateCcw aria-hidden="true" />
      </IconControl>
      <IconControl label={run.playing ? "Pause the run" : "Play the run"} onClick={run.toggle}>
        {run.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </IconControl>
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
            size="icon-lg"
            className="fixed right-4 bottom-4 rounded-full shadow-lg"
            aria-label={`${unread} unread material findings`}
          />
        }
      >
        <Bell aria-hidden="true" />
        {unread > 0 ? (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 min-w-5 justify-center px-1"
          >
            {unread}
          </Badge>
        ) : null}
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Findings</SheetTitle>
          <SheetDescription>Material changes from this run.</SheetDescription>
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
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-xs leading-5 text-muted-foreground">{entry.text}</p>
                  <Button variant="outline" size="sm" onClick={() => onSelect(entry)}>
                    Open agent
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <Card size="sm" className="border-dashed">
                <CardContent className="py-3 text-sm text-muted-foreground">
                  No findings yet.
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
  const [findingsOpen, setFindingsOpen] = React.useState(false)
  const [readFindingIds, setReadFindingIds] = React.useState<ReadonlySet<string>>(() => new Set())

  const urlAgent = React.useSyncExternalStore(noSubscribe, agentFromUrl, () => null)
  const selected = chosen === undefined ? urlAgent : chosen
  const selectedAgent = agents.find((agent) => agent.id === selected) ?? null
  const selectedEntries = selected
    ? run.visible.filter((entry) => entry.agent === selected)
    : []
  const findings = React.useMemo(
    () => run.visible.filter((entry) => materialKinds.has(entry.kind)),
    [run.visible]
  )
  const unreadCount = findings.filter((entry) => !readFindingIds.has(entry.id)).length
  const activeCount = agents.filter((agent) => activeStates.has(run.runtime[agent.id].state)).length

  const select = React.useCallback((id: AgentId | null) => {
    setChosen(id)
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

  return (
    <TooltipProvider>
      <div className="saloon-root flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
              <Radar />
            </span>
            <h1 className="font-heading text-sm font-semibold tracking-tight">The Saloon</h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {run.done ? "Complete" : activeCount > 0 ? `${activeCount} active` : "Waiting"}
            </Badge>
            {run.receiptReady ? (
              <IconControl label="Open decision receipt" onClick={() => setReceiptOpen(true)}>
                <ReceiptText aria-hidden="true" />
              </IconControl>
            ) : null}
            <RunControls run={run} />
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <AgentStage run={run} selected={selected} onSelect={select} />
        </ScrollArea>

        <Sheet open={Boolean(selectedAgent)} onOpenChange={(open) => !open && select(null)}>
          <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>{selectedAgent?.name ?? "Agent"}</SheetTitle>
              <SheetDescription>Selected agent details and latest work.</SheetDescription>
            </SheetHeader>
            {selectedAgent ? (
              <AgentDetails
                agent={selectedAgent}
                runtime={run.runtime[selectedAgent.id]}
                entries={selectedEntries}
                onOpenSource={setSourceId}
              />
            ) : null}
          </SheetContent>
        </Sheet>

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
