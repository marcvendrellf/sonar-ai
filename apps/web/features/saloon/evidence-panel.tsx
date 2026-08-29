"use client"

import type { ReactNode } from "react"
import { ArrowDown, Check, ChevronRight, Minus, ReceiptText, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import {
  pathNodes,
  receipt,
  sources,
  type CheckResult,
  type PathNodeId,
  type RiskCheck,
} from "./run-fixture"

const resultIcon: Record<CheckResult, typeof Check> = {
  pass: Check,
  resize: Minus,
  reject: X,
}

const resultLabel: Record<CheckResult, string> = {
  pass: "Pass",
  resize: "Resized",
  reject: "Rejected",
}

function PanelSection({
  title,
  count,
  children,
}: {
  title: string
  count?: string
  children: ReactNode
}) {
  return (
    <section className="border-b p-4 last:border-b-0">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {count ? (
          <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function RelationshipPath({ revealed }: { revealed: readonly PathNodeId[] }) {
  return (
    <ol className="space-y-1">
      {pathNodes.map((node, index) => {
        const isRevealed = revealed.includes(node.id)
        return (
          <li key={node.id}>
            {index > 0 ? (
              <ArrowDown
                className={cn(
                  "mx-auto my-1 size-3 transition-colors",
                  isRevealed ? "text-[var(--sonar-blue)]" : "text-border"
                )}
                aria-hidden="true"
              />
            ) : null}
            <div
              className={cn(
                "rounded-xl border p-3 transition-colors",
                isRevealed
                  ? "saloon-enter border-[color-mix(in_oklab,var(--sonar-blue)_30%,transparent)] bg-[color-mix(in_oklab,var(--sonar-blue)_7%,transparent)]"
                  : "border-dashed bg-transparent"
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {node.kind}
              </p>
              {isRevealed ? (
                <>
                  <p className="mt-1 text-sm font-medium">{node.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{node.meta}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Not traced yet</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function SourceList({
  readSources,
  onOpenSource,
}: {
  readSources: readonly string[]
  onOpenSource: (id: string) => void
}) {
  if (readSources.length === 0) {
    return <p className="text-xs text-muted-foreground">No source has been read yet.</p>
  }

  return (
    <ul className="space-y-1.5">
      {readSources.map((id) => {
        const source = sources[id]
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onOpenSource(id)}
              className="saloon-enter flex w-full items-start gap-2 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {source.id}
                </span>
                <span className="mt-0.5 block text-xs leading-4">{source.title}</span>
              </span>
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function RiskChecks({ checks }: { checks: readonly RiskCheck[] }) {
  if (checks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No deterministic check has run. Execution stays closed until one does.
      </p>
    )
  }

  return (
    <ul className="space-y-1.5">
      {checks.map((check) => {
        const Icon = resultIcon[check.result]
        return (
          <li
            key={check.id}
            data-result={check.result}
            className="saloon-result saloon-enter flex items-start gap-2 rounded-xl border p-2.5"
          >
            <Icon className="saloon-tone-text mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium">{check.label}</p>
                <span className="saloon-tone-text shrink-0 text-[10px] font-medium">
                  {resultLabel[check.result]}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{check.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function EvidencePanel({
  revealed,
  readSources,
  checks,
  receiptReady,
  onOpenSource,
  onOpenReceipt,
  className,
}: {
  revealed: readonly PathNodeId[]
  readSources: readonly string[]
  checks: readonly RiskCheck[]
  receiptReady: boolean
  onOpenSource: (id: string) => void
  onOpenReceipt: () => void
  className?: string
}) {
  return (
    <aside className={cn("min-h-0 overflow-y-auto", className)} aria-label="Current evidence">
      <PanelSection title="Relationship path" count={`${revealed.length}/${pathNodes.length}`}>
        <RelationshipPath revealed={revealed} />
        <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
          Association shown as evidence. Causal certainty is not claimed.
        </p>
      </PanelSection>

      <PanelSection title="Sources read" count={`${readSources.length}`}>
        <SourceList readSources={readSources} onOpenSource={onOpenSource} />
      </PanelSection>

      <PanelSection title="Deterministic checks" count={`${checks.length}/4`}>
        <RiskChecks checks={checks} />
      </PanelSection>

      <PanelSection title="Decision receipt">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!receiptReady}
          onClick={onOpenReceipt}
        >
          <ReceiptText data-icon="inline-start" />
          {receiptReady ? `Open ${receipt.id}` : "Written at the end of the run"}
        </Button>
      </PanelSection>
    </aside>
  )
}
