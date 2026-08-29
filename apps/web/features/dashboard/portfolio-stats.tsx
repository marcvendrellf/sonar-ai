import {
  ArrowDownRight,
  CheckCircle2,
  CircleMinus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PortfolioStat = {
  id: string
  metric: string
  current: string
  context: string
  difference: string
  status: "complete" | "review" | "neutral"
}

const portfolioStats = [
  {
    id: "nav",
    metric: "Paper NAV",
    current: "€1,018,420",
    context: "Since €1,000,000 launch",
    difference: "+1.84%",
    status: "complete",
  },
  {
    id: "data",
    metric: "Market data",
    current: "Fixture",
    context: "Alpaca Paper fixture",
    difference: "Fixture provenance",
    status: "neutral",
  },
  {
    id: "pnl",
    metric: "Daily paper P&L",
    current: "+€6,240",
    context: "For today",
    difference: "+0.62%",
    status: "complete",
  },
  {
    id: "exposure",
    metric: "Gross exposure",
    current: "82.4%",
    context: "Against 100% maximum",
    difference: "Within limit",
    status: "complete",
  },
  {
    id: "cash",
    metric: "Available cash",
    current: "€179,210",
    context: "17.6% of paper NAV",
    difference: "17.6%",
    status: "complete",
  },
  {
    id: "risk",
    metric: "Risk interventions",
    current: "1",
    context: "Illustrative turnover outcome",
    difference: "Resolved",
    status: "review",
  },
] satisfies ReadonlyArray<PortfolioStat>

const statusStyles = {
  complete: "bg-[var(--status-complete-soft)] text-[var(--status-complete)]",
  review: "bg-[var(--status-review-soft)] text-[var(--status-review)]",
  neutral: "bg-muted text-muted-foreground",
} as const

function StatusIcon({ status }: { status: PortfolioStat["status"] }) {
  if (status === "review") {
    return <ArrowDownRight className="-ml-1 size-4 shrink-0" aria-hidden="true" />
  }

  if (status === "neutral") {
    return <CircleMinus className="-ml-1 size-4 shrink-0" aria-hidden="true" />
  }

  return <CheckCircle2 className="-ml-1 size-4 shrink-0" aria-hidden="true" />
}

export function PortfolioStats() {
  return (
    <section aria-label="Portfolio summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {portfolioStats.map((item) => (
          <Card className="border-0 py-0 shadow-none ring-0" key={item.id}>
            <CardContent className="p-3 sm:p-4">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {item.metric}
              </CardTitle>
              <div className="mt-1.5 flex flex-col items-start gap-1.5">
                <div className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                  {item.current}
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.context}
                </span>
                <Badge
                  className={cn("border-0 px-2 py-0.5 text-xs tabular-nums shadow-none", statusStyles[item.status])}
                  variant="secondary"
                >
                  <StatusIcon status={item.status} />
                  <span className="sr-only">Status: </span>
                  {item.difference}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
