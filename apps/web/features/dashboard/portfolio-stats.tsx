import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedStatValue } from "@/features/dashboard/animated-stat-value"

type PortfolioStat = {
  id: string
  metric: string
  current: string
  difference: string
  initialValue: string
}

const portfolioStats = [
  {
    id: "nav",
    metric: "Paper NAV",
    current: "€1,018,420",
    difference: "+1.84%",
    initialValue: "€1,000,000",
  },
  {
    id: "pnl",
    metric: "Daily P&L",
    current: "+€6,240",
    difference: "+0.62%",
    initialValue: "+€0",
  },
  {
    id: "cash",
    metric: "Available cash",
    current: "€179,210",
    difference: "17.6%",
    initialValue: "€0",
  },
] satisfies ReadonlyArray<PortfolioStat>

export function PortfolioStats() {
  return (
    <section aria-label="Portfolio summary">
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-3 dark:*:data-[slot=card]:bg-card">
        {portfolioStats.map((item) => (
          <Card className="@container/card" key={item.id}>
            <CardHeader>
              <CardDescription>{item.metric}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <AnimatedStatValue initialValue={item.initialValue} value={item.current} />
              </CardTitle>
              <CardAction>
                <Badge className="tabular-nums text-[var(--status-complete)]" variant="outline">
                  <CheckCircle2 aria-hidden="true" />
                  {item.difference}
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
