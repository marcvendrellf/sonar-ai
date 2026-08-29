"use client"

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileSearch,
  Network,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { ReceiptQuestions } from "./receipt-qa"
import {
  agents,
  kindLabels,
  pathNodes,
  type Agent,
  type AgentId,
  type PathNodeId,
  type TraceEntry,
} from "./run-fixture"
import { AgentStateBadge } from "./agent-roster"
import type { AgentRuntime, SaloonRun } from "./use-saloon-run"

const materialKinds: ReadonlySet<TraceEntry["kind"]> = new Set([
  "source",
  "relationship",
  "claim",
  "contradiction",
  "risk",
  "gate",
  "trade",
])

const stateIcon = {
  idle: BookOpen,
  reading: FileSearch,
  tracing: Network,
  debating: AlertTriangle,
  "checking-risk": ShieldCheck,
  executing: Sparkles,
  blocked: AlertTriangle,
  complete: CheckCircle2,
} satisfies Record<AgentRuntime["state"], typeof BookOpen>

function AgentSeat({
  agent,
  runtime,
  selected,
  onSelect,
}: {
  agent: Agent
  runtime: AgentRuntime
  selected: boolean
  onSelect: (id: AgentId) => void
}) {
  const StateIcon = stateIcon[runtime.state]

  return (
    <Button
      variant={selected ? "secondary" : "outline"}
      size="lg"
      data-agent={agent.id}
      aria-pressed={selected}
      onClick={() => onSelect(agent.id)}
      className="saloon-agent h-auto min-h-24 w-full items-start justify-start whitespace-normal p-3 text-left"
    >
      <Avatar size="lg" className="mt-0.5">
        <AvatarFallback className="saloon-tone-wash saloon-tone-text font-semibold">
          {agent.initials}
        </AvatarFallback>
        <AvatarBadge className="saloon-tone-rail">
          <StateIcon aria-hidden="true" />
        </AvatarBadge>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-sm font-semibold">{agent.name}</span>
          <AgentStateBadge state={runtime.state} />
        </span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">{agent.role}</span>
        <span className="mt-2 block line-clamp-2 text-xs font-normal leading-5 text-foreground/80">
          {runtime.task}
        </span>
      </span>
    </Button>
  )
}

function EvidencePath({ revealed }: { revealed: readonly PathNodeId[] }) {
  return (
    <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
      {pathNodes.map((node, index) => {
        const isRevealed = revealed.includes(node.id)
        return (
          <div key={node.id} className="contents">
            <Card
              size="sm"
              className={cn(
                "min-w-0 bg-background/95 transition-opacity",
                !isRevealed && "opacity-35"
              )}
            >
              <CardHeader>
                <CardDescription className="text-[10px] uppercase tracking-wider">
                  {node.kind}
                </CardDescription>
                <CardTitle className="truncate text-xs">{isRevealed ? node.label : "Waiting"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {isRevealed ? node.meta : "Not traced yet"}
                </p>
              </CardContent>
            </Card>
            {index < pathNodes.length - 1 ? (
              <ArrowRight className="hidden self-center text-muted-foreground md:block" aria-hidden="true" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function CommitteeRoom({
  run,
  selected,
  onSelect,
  onOpenReceipt,
}: {
  run: SaloonRun
  selected: AgentId | null
  onSelect: (id: AgentId) => void
  onOpenReceipt: () => void
}) {
  const topSeats = agents.slice(0, 3)
  const bottomSeats = agents.slice(3)
  const latest = run.visible.at(-1)
  const progress = Math.round((run.cursor / run.total) * 100)

  return (
    <Card className="min-h-full bg-muted/25">
      <CardHeader className="border-b">
        <CardTitle>Committee room</CardTitle>
        <CardDescription>
          A 2D fallback for the same staged run. Select any seat to inspect its work.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">6 seats</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          {topSeats.map((agent) => (
            <AgentSeat
              key={agent.id}
              agent={agent}
              runtime={run.runtime[agent.id]}
              selected={selected === agent.id}
              onSelect={onSelect}
            />
          ))}
        </div>

        <Card className="bg-primary text-primary-foreground ring-primary/20">
          <CardHeader className="border-b border-primary-foreground/15">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">EV-104</Badge>
              <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground">
                Historical replay
              </Badge>
              <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground">
                Paper only
              </Badge>
            </div>
            <CardTitle className="mt-2 text-lg">Export-control review</CardTitle>
            <CardDescription className="text-primary-foreground/65">
              Trace the event into the paper book, test the claim, enforce the mandate, and leave a receipt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <EvidencePath revealed={run.revealed} />
            <Separator className="bg-primary-foreground/15" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/55">
                  Latest material event
                </p>
                <p className="mt-1 text-sm leading-6">
                  {latest?.text ?? "The committee is waiting for the event."}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!run.receiptReady}
                onClick={onOpenReceipt}
              >
                <ReceiptText data-icon="inline-start" aria-hidden="true" />
                Open receipt
              </Button>
            </div>
          </CardContent>
          <CardContent>
            <Progress value={progress} aria-label="Committee run progress">
              <ProgressLabel className="text-primary-foreground/70">Run progress</ProgressLabel>
              <ProgressValue className="text-primary-foreground/70">
                {(_formattedValue, value) => `${value ?? 0}%`}
              </ProgressValue>
            </Progress>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          {bottomSeats.map((agent) => (
            <AgentSeat
              key={agent.id}
              agent={agent}
              runtime={run.runtime[agent.id]}
              selected={selected === agent.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SourceButton({
  sourceId,
  onOpenSource,
}: {
  sourceId: string
  onOpenSource: (id: string) => void
}) {
  return (
    <Button variant="outline" size="xs" onClick={() => onOpenSource(sourceId)}>
      <Search data-icon="inline-start" aria-hidden="true" />
      {sourceId}
    </Button>
  )
}

function EventList({
  entries,
  onSelectAgent,
  onOpenSource,
}: {
  entries: readonly TraceEntry[]
  onSelectAgent: (id: AgentId) => void
  onOpenSource: (id: string) => void
}) {
  if (entries.length === 0) {
    return (
      <Card size="sm" className="border-dashed bg-muted/20">
        <CardContent className="py-3 text-sm text-muted-foreground">
          No material events recorded yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const agent = agents.find((candidate) => candidate.id === entry.agent)
        return (
          <Card key={entry.id} size="sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="xs" onClick={() => onSelectAgent(entry.agent)}>
                  {agent?.name ?? entry.agent}
                </Button>
                <Badge variant="outline">{kindLabels[entry.kind]}</Badge>
              </CardTitle>
              <CardAction>
                <time className="font-mono text-[10px] text-muted-foreground">{entry.clock}</time>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5">{entry.text}</p>
              {entry.source ? (
                <div className="mt-2">
                  <SourceButton sourceId={entry.source} onOpenSource={onOpenSource} />
                </div>
              ) : entry.system ? (
                <Badge variant="secondary" className="mt-2 font-mono">
                  {entry.system}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function RoomInspector({
  run,
  selected,
  onSelectAgent,
  onClearSelection,
  onOpenSource,
}: {
  run: SaloonRun
  selected: AgentId | null
  onSelectAgent: (id: AgentId) => void
  onClearSelection: () => void
  onOpenSource: (id: string) => void
}) {
  const selectedAgent = agents.find((agent) => agent.id === selected) ?? null
  const selectedEntries = selected
    ? run.visible.filter((entry) => entry.agent === selected)
    : []
  const latestEntries = run.visible.slice(-8).reverse()
  const materialEntries = latestEntries.filter((entry) => materialKinds.has(entry.kind))

  if (selectedAgent) {
    const runtime = run.runtime[selectedAgent.id]
    return (
      <Card className="h-full rounded-none border-0 ring-0">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="font-semibold">{selectedAgent.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle>{selectedAgent.name}</CardTitle>
              <CardDescription>{selectedAgent.role}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Back
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 p-0">
          <Tabs defaultValue="work" className="h-full gap-0">
            <TabsList variant="line" className="mx-4 mt-3">
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="events">
                Events
                <Badge variant="secondary">{selectedEntries.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ask" disabled={!run.receiptReady}>
                Ask
              </TabsTrigger>
            </TabsList>
            <TabsContent value="work" className="min-h-0">
              <ScrollArea className="h-[calc(100dvh-13rem)]">
                <div className="flex flex-col gap-3 p-4">
                  <Card size="sm" className="bg-muted/30">
                    <CardHeader>
                      <CardDescription>Current task</CardDescription>
                      <CardAction>
                        <AgentStateBadge state={runtime.state} />
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6">{runtime.task}</p>
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Sources", runtime.sources],
                      ["Edges", runtime.edges],
                      ["Claims", runtime.claims],
                      ["Checks", runtime.checks],
                    ].map(([label, value]) => (
                      <Card key={label} size="sm">
                        <CardHeader>
                          <CardDescription>{label}</CardDescription>
                          <CardTitle className="font-mono text-xl">{value}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  <EventList
                    entries={selectedEntries.slice(-3).reverse()}
                    onSelectAgent={onSelectAgent}
                    onOpenSource={onOpenSource}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="events" className="min-h-0">
              <ScrollArea className="h-[calc(100dvh-13rem)]">
                <div className="p-4">
                  <EventList
                    entries={selectedEntries.slice().reverse()}
                    onSelectAgent={onSelectAgent}
                    onOpenSource={onOpenSource}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="ask" className="p-4">
              <ReceiptQuestions enabled={run.receiptReady} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full rounded-none border-0 ring-0">
      <CardHeader className="border-b">
        <CardTitle>Material activity</CardTitle>
        <CardDescription>Only evidence-linked changes and deterministic results appear here.</CardDescription>
        <CardAction>
          <Badge variant="outline">{materialEntries.length} recent</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-[calc(100dvh-9rem)]">
          <div className="p-4">
            <EventList
              entries={materialEntries}
              onSelectAgent={onSelectAgent}
              onOpenSource={onOpenSource}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export { materialKinds }
