import { Database } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedStatValue } from "@/features/dashboard/animated-stat-value"
import {
  committeeDemo,
  defaultDemoPreferences,
  scaleDemoNotional,
} from "@/fixtures/committee-demo"

const euroFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: defaultDemoPreferences.currency,
  maximumFractionDigits: 0,
})

const after = committeeDemo.portfolioAfter ?? committeeDemo.portfolioSnapshot
const nav = scaleDemoNotional(after.nav.amount)
const cash = scaleDemoNotional(after.cash.amount)
const invested = nav - cash
const grossExposure = nav > 0 ? invested / nav : 0
const cashRatio = nav > 0 ? cash / nav : 0

const portfolioStats = [
  {
    id: "nav",
    metric: "Paper NAV",
    current: euroFormatter.format(nav),
    difference: "Synthetic fixture",
    initialValue: euroFormatter.format(
      scaleDemoNotional(committeeDemo.portfolioSnapshot.nav.amount)
    ),
  },
  {
    id: "invested",
    metric: "Invested exposure",
    current: euroFormatter.format(invested),
    difference: `${Math.round(grossExposure * 100)}% gross`,
    initialValue: euroFormatter.format(0),
  },
  {
    id: "cash",
    metric: "Available cash",
    current: euroFormatter.format(cash),
    difference: `${Math.round(cashRatio * 100)}% retained`,
    initialValue: euroFormatter.format(
      scaleDemoNotional(committeeDemo.portfolioSnapshot.cash.amount)
    ),
  },
]

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
                <Badge className="tabular-nums" variant="outline">
                  <Database aria-hidden="true" />
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
