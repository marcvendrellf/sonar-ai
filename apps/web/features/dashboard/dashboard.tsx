"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { AnimatedChart, type ColumnData } from "@/components/animated-chart"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MandateUtilization } from "@/features/dashboard/mandate-utilization"
import { PortfolioStats } from "@/features/dashboard/portfolio-stats"
import {
  committeeDemo,
  defaultDemoPreferences,
  getDemoInstrument,
  scaleDemoNotional,
} from "@/fixtures/committee-demo"

const euroFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: defaultDemoPreferences.currency,
  maximumFractionDigits: 0,
})

const allocationSeries = [
  { time: "14:00", cash: 100_000, invested: 0 },
  { time: "14:01", cash: 100_000, invested: 0 },
  { time: "14:02", cash: 100_000, invested: 0 },
  { time: "14:04", cash: 100_000, invested: 0 },
  { time: "14:05", cash: 0, invested: 100_000 },
  { time: "14:06", cash: 0, invested: 100_000 },
]

const allocationChartConfig = {
  invested: {
    label: "Invested exposure",
    color: "var(--sonar-blue)",
  },
  cash: {
    label: "Cash",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const after = committeeDemo.portfolioAfter ?? committeeDemo.portfolioSnapshot
const cashWeight = after.nav.amount > 0 ? after.cash.amount / after.nav.amount : 0
const positions = after.positions.flatMap((position) => {
  const instrument = getDemoInstrument(position.instrumentId)
  if (!instrument) return []

  return [
    {
      id: position.instrumentId,
      asset: instrument.symbol,
      name: instrument.name,
      sector: instrument.sector,
      weight: `${Math.round(position.weight * 100)}%`,
      value: euroFormatter.format(
        scaleDemoNotional(position.marketValue.amount)
      ),
      averagePrice: euroFormatter.format(position.avgPrice.amount),
    },
  ]
})

const orders = committeeDemo.appliedOrders.flatMap((order) => {
  const instrument = getDemoInstrument(order.instrumentId)
  if (!instrument) return []

  return [
    {
      id: order.id,
      time: order.appliedAt.slice(11, 16),
      asset: instrument.symbol,
      side: order.side,
      quantity: scaleDemoNotional(order.quantity),
      paperPrice: euroFormatter.format(order.price.amount),
      notional: euroFormatter.format(
        scaleDemoNotional(order.notional.amount)
      ),
      receipt: committeeDemo.receipt?.id ?? "rcpt_main",
    },
  ]
})

const agentWork = [
  { id: "portfolio-manager", title: "Portfolio Manager", value: 2, className: "bg-[var(--agent-scout-soft)]", topBorderClassName: "border-[var(--agent-scout)]" },
  { id: "fundamental-analyst", title: "Fundamental Analyst", value: 4, className: "bg-[var(--agent-cartographer-soft)]", topBorderClassName: "border-[var(--agent-cartographer)]" },
  { id: "market-context", title: "Market Context", value: 3, className: "bg-[var(--agent-analyst-soft)]", topBorderClassName: "border-[var(--agent-analyst)]" },
  { id: "risk-officer", title: "Risk Officer", value: 2, className: "bg-[var(--agent-skeptic-soft)]", topBorderClassName: "border-[var(--agent-skeptic)]" },
  { id: "bear-critic", title: "Bear / Critic", value: 2, className: "bg-[var(--agent-marshal-soft)]", topBorderClassName: "border-[var(--agent-marshal)]" },
  { id: "report-writer", title: "Report Writer", value: 1, className: "bg-[var(--status-complete-soft)]", topBorderClassName: "border-[var(--status-complete)]" },
] satisfies ColumnData[]

const event = committeeDemo.materialEvents[0]
const resizedCheck = committeeDemo.riskChecks.find((check) => check.result === "resize")

function AllocationChart() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Paper allocation through the committee run</CardTitle>
        <CardDescription>$100,000 onboarding baseline · synthetic fixture</CardDescription>
        <CardAction>
          <Badge variant="outline">Human approved</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={allocationChartConfig}
        >
          <AreaChart accessibilityLayer data={allocationSeries}>
            <defs>
              <linearGradient id="fillInvested" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-invested)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-invested)" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="fillCash" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cash)" stopOpacity={0.65} />
                <stop offset="95%" stopColor="var(--color-cash)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="time"
              minTickGap={24}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={false} />
            <Area
              dataKey="cash"
              fill="url(#fillCash)"
              fillOpacity={0.6}
              stackId="allocation"
              stroke="var(--color-cash)"
              strokeWidth={2}
              type="stepAfter"
            />
            <Area
              dataKey="invested"
              fill="url(#fillInvested)"
              fillOpacity={0.6}
              stackId="allocation"
              stroke="var(--color-invested)"
              strokeWidth={2}
              type="stepAfter"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function DecisionReceipt() {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex flex-wrap gap-2">
          <Badge variant="secondary">Synthetic event</Badge>
          <Badge variant="outline">Approved · paper only</Badge>
        </div>
        <CardTitle>{event?.headline ?? "Synthetic committee review"}</CardTitle>
        <CardDescription>
          {event?.summary ?? "A prepared event was reviewed by the investment committee."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">Portfolio Manager</p>
          <p className="mt-1 text-sm leading-6">
            Defensive Growth allocation: 55% equities, 40% fixed income and 5% crypto.
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">Risk Officer</p>
          <p className="mt-1 text-sm leading-6">
            {resizedCheck?.detail ?? "Core mandate checks passed."}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">Bear / Critic</p>
          <p className="mt-1 text-sm leading-6">
            {committeeDemo.bearCase?.failureScenarios[0] ??
              "The counter-case remains attached to the decision."}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">Report Writer</p>
          <p className="mt-1 text-sm leading-6">
            {committeeDemo.report?.decisionSummary ?? "Decision report complete."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  return (
    <main
      className="@container/main mx-auto w-full max-w-[1600px] scroll-mt-[var(--header-height)] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
      id="dashboard"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Paper fund overview
          </h1>
          <Badge variant="outline">Synthetic fixture</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Core mandate · U.S. stocks, ETFs and crypto enabled for research
        </p>
      </div>

      <PortfolioStats />
      <AllocationChart />

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current paper positions</CardTitle>
            <CardDescription>Applied only after deterministic checks and human approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Paper value</TableHead>
                  <TableHead className="text-right">Average price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <p className="font-medium">{position.asset}</p>
                      <p className="text-xs text-muted-foreground">{position.name}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{position.sector}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.weight}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.value}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.averagePrice}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Cash</TableCell>
                  <TableCell className="text-muted-foreground">Reserve</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Math.round(cashWeight * 100)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {euroFormatter.format(
                      scaleDemoNotional(after.cash.amount)
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="scroll-mt-[var(--header-height)]" id="mandate">
          <MandateUtilization />
        </div>
      </section>

      <DecisionReceipt />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="scroll-mt-[var(--header-height)]" id="saloon">
          <CardHeader>
            <CardTitle>Committee work completed</CardTitle>
            <CardDescription>Observable stage outputs—not agent chat volume</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedChart
              className="h-64 overflow-hidden rounded-xl border-0"
              columns={agentWork}
              maxValue={4}
              titleClassName="text-[10px] leading-tight [overflow-wrap:anywhere] sm:text-xs"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent paper orders</CardTitle>
            <CardDescription>Fixture prices · Alpaca paper path only</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Paper price</TableHead>
                  <TableHead className="text-right">Notional</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.time}
                    </TableCell>
                    <TableCell className="font-medium">{order.asset}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.side}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{order.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{order.paperPrice}</TableCell>
                    <TableCell className="text-right tabular-nums">{order.notional}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.receipt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
