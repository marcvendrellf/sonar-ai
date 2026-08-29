"use client"

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileSearch,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { AgentStateBadge } from "./agent-roster"
import {
  agents,
  kindLabels,
  type Agent,
  type AgentId,
  type TraceEntry,
} from "./run-fixture"
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

function AgentCard({
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
    <Card
      data-agent={agent.id}
      className={cn(
        "saloon-agent gap-0 py-0 transition-[transform,box-shadow]",
        selected && "saloon-tone-edge shadow-md"
      )}
    >
      <CardContent className="h-full px-0">
        <Button
          variant="ghost"
          aria-pressed={selected}
          onClick={() => onSelect(agent.id)}
          className="h-full min-h-44 w-full flex-col gap-4 rounded-xl p-4 whitespace-normal sm:min-h-52 lg:min-h-60"
        >
          <Avatar className="size-20 sm:size-24 lg:size-28">
            <AvatarFallback className="saloon-tone-wash saloon-tone-text font-heading text-2xl font-semibold sm:text-3xl">
              {agent.initials}
            </AvatarFallback>
            <AvatarBadge className="saloon-tone-rail size-5 [&>svg]:size-3">
              <StateIcon aria-hidden="true" />
            </AvatarBadge>
          </Avatar>

          <span className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-heading text-base font-semibold sm:text-lg">{agent.name}</span>
            <span className="text-xs font-normal text-muted-foreground sm:text-sm">{agent.role}</span>
            <AgentStateBadge state={runtime.state} />
          </span>
        </Button>
      </CardContent>
    </Card>
  )
}

export function AgentStage({
  run,
  selected,
  onSelect,
}: {
  run: SaloonRun
  selected: AgentId | null
  onSelect: (id: AgentId) => void
}) {
  return (
    <main className="grid min-h-full grid-cols-2 gap-3 p-3 pb-20 sm:grid-cols-3 sm:gap-4 sm:p-4 sm:pb-20 lg:gap-6 lg:p-8 lg:pb-20">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          runtime={run.runtime[agent.id]}
          selected={selected === agent.id}
          onSelect={onSelect}
        />
      ))}
    </main>
  )
}

function EventCard({
  entry,
  onOpenSource,
}: {
  entry: TraceEntry
  onOpenSource: (id: string) => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {kindLabels[entry.kind]}
          <Badge variant="outline">{entry.clock}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{entry.text}</p>
        {entry.source ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => onOpenSource(entry.source ?? "")}
            className="mt-3"
          >
            <Search data-icon="inline-start" aria-hidden="true" />
            {entry.source}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function AgentDetails({
  agent,
  runtime,
  entries,
  onOpenSource,
}: {
  agent: Agent
  runtime: AgentRuntime
  entries: readonly TraceEntry[]
  onOpenSource: (id: string) => void
}) {
  const StateIcon = stateIcon[runtime.state]
  const recent = entries.slice(-4).reverse()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar className="size-24">
          <AvatarFallback className="font-heading text-3xl font-semibold">{agent.initials}</AvatarFallback>
          <AvatarBadge className="size-5">
            <StateIcon aria-hidden="true" />
          </AvatarBadge>
        </Avatar>
        <div>
          <h2 className="font-heading text-xl font-semibold">{agent.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{agent.role}</p>
        </div>
        <AgentStateBadge state={runtime.state} />
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Card size="sm" className="bg-muted/30">
            <CardHeader>
              <CardDescription>Current task</CardDescription>
              <CardTitle>{runtime.task}</CardTitle>
            </CardHeader>
          </Card>

          {recent.length > 0 ? (
            <section className="flex flex-col gap-2" aria-labelledby="agent-events-title">
              <h3 id="agent-events-title" className="text-sm font-medium">Latest work</h3>
              {recent.map((entry) => (
                <EventCard key={entry.id} entry={entry} onOpenSource={onOpenSource} />
              ))}
            </section>
          ) : (
            <Card size="sm" className="border-dashed">
              <CardContent className="py-3 text-sm text-muted-foreground">
                Waiting for this agent to begin.
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export { materialKinds }
