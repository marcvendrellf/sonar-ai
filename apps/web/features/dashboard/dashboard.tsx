"use client"

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Landmark,
  Radar,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { AnimatedChart, type ColumnData } from "@/components/animated-chart"
import { AgentActivityFeed } from "@/components/blocks/activity-1"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const metrics = [
  {
    id: "nav",
    label: "Paper NAV",
    value: "€1,018,420",
    detail: "+1.84% since launch",
    icon: Landmark,
  },
  {
    id: "pnl",
    label: "Daily paper P&L",
    value: "+€6,240",
    detail: "+0.62% today",
    icon: ArrowUpRight,
  },
  {
    id: "exposure",
    label: "Gross exposure",
    value: "82.4%",
    detail: "Within 100% mandate",
    icon: CircleDollarSign,
  },
  {
    id: "cash",
    label: "Available cash",
    value: "€179,210",
    detail: "17.6% of NAV",
    icon: WalletCards,
  },
  {
    id: "risk",
    label: "Active risk flags",
    value: "1",
    detail: "Turnover order resized",
    icon: TriangleAlert,
  },
] as const

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
  { id: "cartographer", title: "Map", value: 27, className: "bg-[var(--agent-cartographer-soft)]", topBorderClassName: "border-[var(--agent-cartographer)]" },
  { id: "analyst", title: "Bull", value: 13, className: "bg-[var(--agent-analyst-soft)]", topBorderClassName: "border-[var(--agent-analyst)]" },
  { id: "skeptic", title: "Bear", value: 11, className: "bg-[var(--agent-skeptic-soft)]", topBorderClassName: "border-[var(--agent-skeptic)]" },
  { id: "marshal", title: "Risk", value: 8, className: "bg-[var(--agent-marshal-soft)]", topBorderClassName: "border-[var(--agent-marshal)]" },
] satisfies ColumnData[]

function ReceiptSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        View receipt
        <ChevronRight data-icon="inline-end" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Historical replay</Badge>
            <Badge className="bg-[var(--status-complete-soft)] text-[var(--status-complete)]">Complete</Badge>
          </div>
          <SheetTitle>Decision receipt SR-042</SheetTitle>
          <SheetDescription>Paper rebalance recorded at 09:43:12 UTC.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <section aria-labelledby="receipt-thesis">
            <h3 id="receipt-thesis" className="mb-2 text-sm font-medium">Accepted thesis</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              The prepared event raises second-order demand risk for a current semiconductor exposure. The relationship is evidence, not proof of causation.
            </p>
          </section>
          <section aria-labelledby="receipt-path">
            <h3 id="receipt-path" className="mb-3 text-sm font-medium">Evidence path</h3>
            <ol className="space-y-2 text-sm">
              <li className="rounded-lg border p-3">EV-104 · Prepared export-control event</li>
              <li className="rounded-lg border p-3">ED-208 · Supplier relationship observed 2026-08-28</li>
              <li className="rounded-lg border p-3">POS-02 · Nordic Semiconductor paper position</li>
            </ol>
          </section>
          <section aria-labelledby="receipt-risk">
            <h3 id="receipt-risk" className="mb-3 text-sm font-medium">Deterministic checks</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <Check className="size-4 text-[var(--status-complete)]" aria-hidden="true" />
                Position exposure remains below 30%
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[var(--status-review-soft)] p-3 text-sm">
                <ArrowDownRight className="size-4 text-[var(--status-review)]" aria-hidden="true" />
                Sell resized from €62,000 to €41,500 to cap turnover
              </div>
            </div>
          </section>
          <Button className="w-full" disabled>
            <ExternalLink />
            Full evidence record not connected
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FundStateCard() {
  return (
    <Card className="overflow-hidden bg-[var(--sonar-navy)] text-white ring-0">
      <CardHeader>
        <div className="mb-8 flex items-center justify-between">
          <Badge className="bg-white/10 text-white">Fund state · complete</Badge>
          <Radar className="size-5 text-[var(--sonar-cyan)]" aria-hidden="true" />
        </div>
        <CardTitle className="max-w-md text-2xl text-white sm:text-3xl">The mandate held. One order was resized.</CardTitle>
        <CardDescription className="max-w-xl text-white/60">
          The agents traced a sourced relationship, challenged the thesis, and passed the final paper order through deterministic limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/50">Current phase</p>
          <p className="mt-1 text-sm font-medium">Complete</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/50">Accepted paper order</p>
          <p className="mt-1 text-sm font-medium">Sell €41,500 NOD.OL</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/50">Decision receipt</p>
          <p className="mt-1 text-sm font-medium">SR-042</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RelationshipPath() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active relationship path</CardTitle>
        <CardDescription>Every edge opens to a source record.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-xl border bg-muted/40 p-3">
            <Badge variant="outline" className="mb-4">Event</Badge>
            <p className="text-sm font-medium">Export-control replay</p>
            <p className="mt-1 text-xs text-muted-foreground">EV-104 · historical</p>
          </div>
          <ArrowRight className="mx-auto size-4 rotate-90 text-[var(--sonar-blue)] md:rotate-0" aria-hidden="true" />
          <div className="rounded-xl border border-[var(--sonar-blue)]/30 bg-[var(--sonar-blue-soft)] p-3">
            <Badge variant="outline" className="mb-4">Relationship</Badge>
            <p className="text-sm font-medium">Supplies low-power chips</p>
            <p className="mt-1 text-xs text-muted-foreground">ED-208 · Cala fixture</p>
          </div>
          <ArrowRight className="mx-auto size-4 rotate-90 text-[var(--sonar-blue)] md:rotate-0" aria-hidden="true" />
          <div className="rounded-xl border bg-muted/40 p-3">
            <Badge variant="outline" className="mb-4">Position</Badge>
            <p className="text-sm font-medium">Nordic Semiconductor</p>
            <p className="mt-1 text-xs text-muted-foreground">18.6% paper weight</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">Association shown as evidence. Causal certainty is not claimed.</p>
          <ReceiptSheet />
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  return (
    <main id="dashboard" className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Mandate locked</Badge>
            <Badge variant="outline">5 positions</Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Paper fund overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">One prepared event, six agents, and an inspectable decision trail.</p>
        </div>
        <Button render={<a href="#decisions" />}>
          <ReceiptText />
          Latest decision
        </Button>
      </div>

      <section aria-label="Portfolio summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.id} size="sm">
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardAction>
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </CardAction>
                <CardTitle className="text-xl tabular-nums">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{metric.detail}</CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <FundStateCard />
        <Card>
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
      </section>

      <RelationshipPath />

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
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
                  <TableHead className="text-right">Paper P&L</TableHead>
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
        <AgentActivityFeed />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]" id="saloon">
        <Card>
          <CardHeader>
            <CardTitle>Agent work completed</CardTitle>
            <CardDescription>Sources, relationships, claims, and risk checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedChart columns={agentWork} maxValue={30} className="h-64 overflow-hidden rounded-xl" />
          </CardContent>
        </Card>
        <Card id="decisions">
          <CardHeader>
            <CardTitle>Latest paper decision</CardTitle>
            <CardDescription>The Marshal resized one proposed order before execution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <FileCheck2 className="mt-0.5 size-5 text-[var(--sonar-blue)]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">Reduce NOD.OL paper exposure</p>
                  <Badge className="bg-[var(--status-review-soft)] text-[var(--status-review)]">Resized</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Proposed €62,000 sell. Accepted €41,500 sell after turnover and cash checks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <ShieldCheck className="mt-0.5 size-5 text-[var(--status-complete)]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">Increase cash buffer</p>
                  <Badge className="bg-[var(--status-complete-soft)] text-[var(--status-complete)]">Passed</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Resulting cash remains above the written 10% minimum.</p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <ReceiptSheet />
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="mandate" className="sr-only" aria-label="Mandate anchor" />
    </main>
  )
}
