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

const navSeries = [
  { time: "09:00", nav: 1000000 },
  { time: "09:05", nav: 1001800 },
  { time: "09:10", nav: 1004200 },
  { time: "09:15", nav: 1003100 },
  { time: "09:20", nav: 1006700 },
  { time: "09:25", nav: 1001800 },
  { time: "09:30", nav: 1005900 },
  { time: "09:35", nav: 1008700 },
  { time: "09:40", nav: 1007200 },
  { time: "09:45", nav: 1010500 },
  { time: "09:50", nav: 1013400 },
  { time: "09:55", nav: 1011700 },
  { time: "10:00", nav: 1008900 },
  { time: "10:05", nav: 1014200 },
  { time: "10:10", nav: 1016100 },
  { time: "10:15", nav: 1018420 },
] as const

const navChartConfig = {
  nav: {
    label: "Paper NAV",
    color: "var(--sonar-blue)",
  },
} satisfies ChartConfig

const positions = [
  { id: "asml", asset: "ASML", sector: "Semiconductors", weight: "24.8%", value: "€252,580", paperPnl: "+3.2%" },
  { id: "nordic", asset: "NOD.OL", sector: "Semiconductors", weight: "18.6%", value: "€189,430", paperPnl: "+1.7%" },
  { id: "siemens", asset: "SIE.DE", sector: "Industrials", weight: "16.4%", value: "€167,020", paperPnl: "+0.4%" },
  { id: "sap", asset: "SAP.DE", sector: "Software", weight: "12.1%", value: "€123,230", paperPnl: "-0.8%" },
  { id: "airbus", asset: "AIR.PA", sector: "Aerospace", weight: "10.5%", value: "€106,950", paperPnl: "+1.1%" },
] as const

const agentWork = [
  { id: "scout", title: "Scout", value: 18, className: "bg-[var(--agent-scout-soft)]", topBorderClassName: "border-[var(--agent-scout)]" },
  { id: "cartographer", title: "Cartographer", value: 27, className: "bg-[var(--agent-cartographer-soft)]", topBorderClassName: "border-[var(--agent-cartographer)]" },
  { id: "analyst", title: "Analyst", value: 13, className: "bg-[var(--agent-analyst-soft)]", topBorderClassName: "border-[var(--agent-analyst)]" },
  { id: "skeptic", title: "Skeptic", value: 11, className: "bg-[var(--agent-skeptic-soft)]", topBorderClassName: "border-[var(--agent-skeptic)]" },
  { id: "marshal", title: "Marshal", value: 8, className: "bg-[var(--agent-marshal-soft)]", topBorderClassName: "border-[var(--agent-marshal)]" },
  { id: "trader", title: "Trader", value: 3, className: "bg-[var(--status-complete-soft)]", topBorderClassName: "border-[var(--status-complete)]" },
] satisfies ColumnData[]

function PaperNavChart() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Paper NAV</CardTitle>
        <CardDescription>Today · EUR</CardDescription>
        <CardAction>
          <Badge className="text-[var(--status-complete)]" variant="outline">
            +1.84%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={navChartConfig}
        >
          <AreaChart accessibilityLayer data={navSeries}>
            <defs>
              <linearGradient id="fillPaperNav" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-nav)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-nav)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="time"
              minTickGap={32}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex min-w-36 items-center justify-between gap-4">
                      <span className="text-muted-foreground">Paper NAV</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {typeof value === "number"
                          ? new Intl.NumberFormat("en-IE", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                            }).format(value)
                          : value}
                      </span>
                    </div>
                  )}
                  hideLabel={false}
                  indicator="dot"
                />
              }
              cursor={false}
            />
            <Area
              dataKey="nav"
              fill="url(#fillPaperNav)"
              fillOpacity={0.6}
              stroke="var(--color-nav)"
              strokeWidth={2}
              type="natural"
            />
          </AreaChart>
        </ChartContainer>
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
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Paper fund overview
      </h1>

      <PortfolioStats />

      <PaperNavChart />

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Paper value</TableHead>
                  <TableHead className="text-right">Paper P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.asset}</TableCell>
                    <TableCell className="text-muted-foreground">{position.sector}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.weight}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.value}</TableCell>
                    <TableCell className="text-right tabular-nums">{position.paperPnl}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="scroll-mt-[var(--header-height)]" id="mandate">
          <MandateUtilization />
        </div>
      </section>

      <Card className="scroll-mt-[var(--header-height)]" id="saloon">
        <CardHeader>
          <CardTitle>Agent work completed</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedChart
            className="h-64 overflow-hidden rounded-xl border-0"
            columns={agentWork}
            maxValue={30}
            titleClassName="text-[10px] leading-tight [overflow-wrap:anywhere] sm:text-xs"
          />
        </CardContent>
      </Card>
    </main>
  )
}
