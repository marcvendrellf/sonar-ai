"use client"

import { cn } from "@/lib/utils"

import {
  agents,
  stateLabels,
  type AgentState,
} from "./run-fixture"
import type { AgentRuntime } from "./use-saloon-run"
import type { AgentId } from "./run-fixture"

const workingStates: ReadonlySet<AgentState> = new Set([
  "reading",
  "tracing",
  "debating",
  "checking-risk",
  "executing",
])

export function AgentStateBadge({
  state,
  className,
}: {
  state: AgentState
  className?: string
}) {
  return (
    <span
      data-state={state}
      className={cn(
        "saloon-state inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium",
        className
      )}
    >
      <span
        className="saloon-pulse size-1.5 rounded-full bg-current"
        data-active={workingStates.has(state)}
        aria-hidden="true"
      />
      {stateLabels[state]}
    </span>
  )
}

function Counters({ runtime }: { runtime: AgentRuntime }) {
  const parts = [
    [runtime.sources, "sources"],
    [runtime.edges, "edges"],
    [runtime.claims, "claims"],
    [runtime.checks, "checks"],
    [runtime.orders, "orders"],
  ] as const

  const shown = parts.filter(([count]) => count > 0)
  if (shown.length === 0) return null

  return (
    <p className="mt-1.5 pl-9 font-mono text-[10px] text-muted-foreground">
      {shown.map(([count, label]) => `${count} ${label}`).join(" · ")}
    </p>
  )
}

export function AgentRoster({
  runtime,
  selected,
  onSelect,
  className,
}: {
  runtime: Record<AgentId, AgentRuntime>
  selected: AgentId | null
  onSelect: (id: AgentId) => void
  className?: string
}) {
  const working = agents.filter((agent) => workingStates.has(runtime[agent.id].state)).length

  return (
    <section className={className} aria-label="Agent roster">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-medium">At the table</h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {working} working · {agents.length} seated
        </span>
      </div>
      <ol className="space-y-1.5">
        {agents.map((agent) => {
          const state = runtime[agent.id]
          const isWorking = workingStates.has(state.state)
          return (
            <li key={agent.id}>
              <button
                type="button"
                data-agent={agent.id}
                aria-pressed={selected === agent.id}
                onClick={() => onSelect(agent.id)}
                className={cn(
                  "saloon-agent relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected === agent.id
                    ? "saloon-tone-edge saloon-tone-wash"
                    : isWorking
                      ? "saloon-tone-edge bg-card"
                      : "bg-card/40"
                )}
              >
              <span
                className="saloon-tone-rail saloon-pulse absolute inset-y-2 left-0 w-0.5 rounded-full"
                data-active={isWorking}
                aria-hidden="true"
              />
              <div className="flex items-center gap-2">
                <span
                  className="saloon-tone-text saloon-tone-wash grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold tracking-wide"
                  aria-hidden="true"
                >
                  {agent.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{agent.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {agent.role}
                  </span>
                </span>
                <AgentStateBadge state={state.state} />
              </div>
                <p className="mt-2 pl-9 text-xs leading-4 text-muted-foreground">{state.task}</p>
                <Counters runtime={state} />
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
