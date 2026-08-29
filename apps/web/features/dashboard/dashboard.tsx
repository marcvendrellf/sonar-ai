"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { AnimatedChart, type ColumnData } from "@/components/animated-chart"
import { MandateUtilization } from "@/features/dashboard/mandate-utilization"
import { PortfolioStats } from "@/features/dashboard/portfolio-stats"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const navSeries = [
  { time: "09:00", nav: 1000000 },
  { time: "09:15", nav: 1004200 },
  { time: "09:30", nav: 1001800 },
  { time: "09:45", nav: 1010500 },
  { time: "10:00", nav: 1008900 },
  { time: "10:15", nav: 1018420 },
] as const

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

export function Dashboard() {
  return (
    <main id="dashboard" className="mx-auto max-w-[1600px] scroll-mt-[var(--header-height)] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div className="space-y-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Paper fund overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">One prepared event, six agents, and an inspectable decision trail.</p>
        </div>

        <PortfolioStats />

        <Card className="border-0 shadow-none ring-0">
          <CardHeader>
            <CardTitle>Paper NAV</CardTitle>
            <CardDescription>Session history · EUR</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={navSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis hide domain={[995000, 1025000]} />
                <Line type="monotone" dataKey="nav" stroke="var(--sonar-blue)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-0 shadow-none ring-0">
          <CardHeader>
            <CardTitle>Current positions</CardTitle>
            <CardDescription>Internal paper portfolio. No brokerage orders are available.</CardDescription>
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
        <div id="mandate" className="scroll-mt-[var(--header-height)]">
          <MandateUtilization />
        </div>
      </section>

      <Card id="saloon" className="scroll-mt-[var(--header-height)] border-0 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Agent work completed</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedChart
            columns={agentWork}
            maxValue={30}
            titleClassName="text-[10px] leading-tight [overflow-wrap:anywhere] sm:text-xs"
            className="h-64 overflow-hidden rounded-xl border-0"
          />
        </CardContent>
      </Card>
    </main>
  )
}
