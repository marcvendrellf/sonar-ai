"use client"

import { Check, ExternalLink, Minus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  pathNodes,
  receipt,
  sources,
  type CheckResult,
  type RiskCheck,
} from "./run-fixture"

const resultIcon: Record<CheckResult, typeof Check> = {
  pass: Check,
  resize: Minus,
  reject: X,
}

export function SourceSheet({
  sourceId,
  onOpenChange,
}: {
  sourceId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const source = sourceId ? sources[sourceId] : null

  return (
    <Sheet open={Boolean(source)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {source ? (
          <>
            <SheetHeader className="border-b">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {source.id}
                </Badge>
                <Badge variant="outline">Fixture</Badge>
              </div>
              <SheetTitle>{source.title}</SheetTitle>
              <SheetDescription>{source.publisher}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-4">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Observed at</dt>
                  <dd className="mt-0.5 font-mono text-xs">{source.observedAt}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs">{source.url}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Graph edge it supports</dt>
                  <dd className="mt-0.5 text-sm leading-6">{source.edge}</dd>
                </div>
              </dl>
              <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
                {source.note}
              </p>
              <Button className="w-full" disabled>
                <ExternalLink data-icon="inline-start" />
                Live source not connected in the lab
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function ReceiptSheet({
  open,
  onOpenChange,
  checks,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  checks: readonly RiskCheck[]
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Historical replay</Badge>
            <Badge variant="outline">Paper only</Badge>
          </div>
          <SheetTitle>Decision receipt {receipt.id}</SheetTitle>
          <SheetDescription>Paper rebalance recorded at {receipt.writtenAt}.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <section aria-labelledby="receipt-thesis">
            <h3 id="receipt-thesis" className="mb-2 text-sm font-medium">
              Accepted thesis
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">{receipt.thesis}</p>
            <p className="mt-2 text-xs text-muted-foreground">Conviction: {receipt.conviction}</p>
          </section>

          <section aria-labelledby="receipt-path">
            <h3 id="receipt-path" className="mb-3 text-sm font-medium">
              Evidence path
            </h3>
            <ol className="space-y-2 text-sm">
              {pathNodes.map((node) => (
                <li key={node.id} className="rounded-xl border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {node.kind}
                  </p>
                  <p className="mt-1">{node.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{node.meta}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="receipt-checks">
            <h3 id="receipt-checks" className="mb-3 text-sm font-medium">
              Deterministic checks
            </h3>
            <div className="space-y-2">
              {checks.map((check) => {
                const Icon = resultIcon[check.result]
                return (
                  <div
                    key={check.id}
                    data-result={check.result}
                    className="saloon-result flex items-start gap-2 rounded-xl bg-muted p-3 text-sm"
                  >
                    <Icon className="saloon-tone-text mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <div>
                      <p>{check.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="receipt-orders">
            <h3 id="receipt-orders" className="mb-3 text-sm font-medium">
              Orders
            </h3>
            <div className="space-y-2 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Applied</p>
                <p className="mt-1">{receipt.acceptedOrder}</p>
              </div>
              <div className="rounded-xl border border-dashed p-3">
                <p className="text-xs text-muted-foreground">Rejected alternative</p>
                <p className="mt-1">{receipt.rejectedAlternative}</p>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
