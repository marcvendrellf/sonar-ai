"use client"

import { ArrowLeft, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { AgentStateBadge } from "./agent-roster"
import { kindLabels, type Agent, type TraceEntry } from "./run-fixture"
import type { AgentRuntime } from "./use-saloon-run"

type Group = {
  id: string
  title: string
  note: string
  kinds: ReadonlyArray<TraceEntry["kind"]>
}

/** Source facts, model claims, and deterministic results never share a section. */
const groups: readonly Group[] = [
  {
    id: "sourced",
    title: "Sourced observations",
    note: "Read from a source or written into the graph.",
    kinds: ["source", "relationship"],
  },
  {
    id: "claims",
    title: "Model claims",
    note: "Proposed by the model. Evidence-linked, not proven.",
    kinds: ["claim", "contradiction"],
  },
  {
    id: "deterministic",
    title: "Deterministic results",
    note: "Produced by code, not by a model.",
    kinds: ["risk", "gate", "trade", "checkpoint"],
  },
]

function RecordList({
  records,
  onOpenSource,
}: {
  records: readonly TraceEntry[]
  onOpenSource: (id: string) => void
}) {
  return (
    <ol className="space-y-1.5">
      {records.map((record) => {
        const sourceId = record.source

        return (
          <li key={record.id} className="rounded-xl border p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{kindLabels[record.kind]}</span>
              <time className="font-mono text-[10px] text-muted-foreground">{record.clock}</time>
            </div>
            <p className="mt-1 text-xs leading-5">{record.text}</p>
            {sourceId || record.system ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {sourceId ? (
                  <button
                    type="button"
                    onClick={() => onOpenSource(sourceId)}
                    className="inline-flex h-5 items-center gap-1 rounded-full border px-2 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Search className="size-2.5" aria-hidden="true" />
                    {sourceId}
                  </button>
                ) : null}
                {record.system ? (
                  <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 font-mono text-[10px] text-muted-foreground">
                    {record.system}
                  </span>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function AgentInterviewPanel({
  agent,
  runtime,
  records,
  onOpenSource,
  onBack,
  className,
}: {
  agent: Agent
  runtime: AgentRuntime
  records: readonly TraceEntry[]
  onOpenSource: (id: string) => void
  onBack: () => void
  className?: string
}) {
  const latest = records.at(-1)
  const blocker = runtime.state === "blocked" ? records.findLast((r) => r.kind === "gate") : null

  return (
    <div className={cn("space-y-4 p-4", className)}>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to the table
      </Button>

      <header data-agent={agent.id} className="saloon-agent">
        <div className="flex items-center gap-2">
          <span
            className="saloon-tone-text saloon-tone-wash grid size-8 place-items-center rounded-lg text-[11px] font-semibold"
            aria-hidden="true"
          >
            {agent.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-semibold tracking-tight">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
          <AgentStateBadge state={runtime.state} />
        </div>
        <p className="mt-3 text-sm leading-6">{runtime.task}</p>
      </header>

      {blocker ? (
        <div data-state="blocked" className="saloon-state rounded-xl p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider">Blocker</p>
          <p className="mt-1 text-xs leading-5">{blocker.text}</p>
        </div>
      ) : null}

      {latest ? (
        <div className="rounded-xl border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Latest material event
          </p>
          <p className="mt-1 text-xs leading-5">{latest.text}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{latest.clock}</p>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          {agent.name} has not recorded anything in this run yet.
        </p>
      )}

      {groups.map((group) => {
        const matched = records.filter((record) => group.kinds.includes(record.kind))
        if (matched.length === 0) return null
        return (
          <section key={group.id}>
            <h3 className="text-sm font-medium">{group.title}</h3>
            <p className="mb-2 text-[11px] text-muted-foreground">{group.note}</p>
            <RecordList records={matched} onOpenSource={onOpenSource} />
          </section>
        )
      })}
    </div>
  )
}
