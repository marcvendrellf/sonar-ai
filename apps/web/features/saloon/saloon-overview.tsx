"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { AnimatedChart, type ColumnData } from "@/components/animated-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const agentWork = [
  {
    id: "portfolio-manager",
    title: "Portfolio Manager",
    value: 2,
    className: "bg-[var(--agent-scout-soft)]",
    topBorderClassName: "border-[var(--agent-scout)]",
  },
  {
    id: "fundamental-analyst",
    title: "Fundamental Analyst",
    value: 4,
    className: "bg-[var(--agent-cartographer-soft)]",
    topBorderClassName: "border-[var(--agent-cartographer)]",
  },
  {
    id: "market-context",
    title: "Market Context",
    value: 3,
    className: "bg-[var(--agent-analyst-soft)]",
    topBorderClassName: "border-[var(--agent-analyst)]",
  },
  {
    id: "risk-officer",
    title: "Risk Officer",
    value: 2,
    className: "bg-[var(--agent-skeptic-soft)]",
    topBorderClassName: "border-[var(--agent-skeptic)]",
  },
  {
    id: "bear-critic",
    title: "Bear / Critic",
    value: 2,
    className: "bg-[var(--agent-marshal-soft)]",
    topBorderClassName: "border-[var(--agent-marshal)]",
  },
  {
    id: "report-writer",
    title: "Report Writer",
    value: 1,
    className: "bg-[var(--status-complete-soft)]",
    topBorderClassName: "border-[var(--status-complete)]",
  },
] satisfies ColumnData[]

const researchActivity = [
  { time: "14:00", discoveries: 0, evidenceLinks: 1 },
  { time: "14:01", discoveries: 1, evidenceLinks: 3 },
  { time: "14:02", discoveries: 2, evidenceLinks: 6 },
  { time: "14:03", discoveries: 2, evidenceLinks: 6 },
  { time: "14:04", discoveries: 3, evidenceLinks: 6 },
  { time: "14:05", discoveries: 4, evidenceLinks: 6 },
]

const activityChartConfig = {
  discoveries: {
    label: "Material findings",
    color: "var(--chart-1)",
  },
  evidenceLinks: {
    label: "Evidence links",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const latestDiscoveries = [
  {
    id: "discovery-01",
    title: "Grid demand makes Siemens Energy a second-order AI beneficiary",
    detail: "Inferred Cala relationship · confidence 0.75",
    agent: "Market Context",
    signal: "Relationship",
    updated: "14:01",
    evidence: "ev_power_demand",
  },
  {
    id: "discovery-02",
    title: "Nvidia has the stronger moat; Siemens offers the less extended valuation",
    detail: "Evidence-linked fundamental comparison",
    agent: "Fundamental",
    signal: "Research",
    updated: "14:02",
    evidence: "ev_siemens_fund",
  },
  {
    id: "discovery-03",
    title: "Nvidia's proposed 35% weight breaches the Core mandate",
    detail: "Deterministic position-limit check · resized to 30%",
    agent: "Risk Officer",
    signal: "Resize",
    updated: "14:04",
    evidence: "rsk_nvda",
  },
  {
    id: "discovery-04",
    title: "ASML constraints and an AI-capex slowdown weaken the direct thesis",
    detail: "Counter-case recorded without veto authority",
    agent: "Bear / Critic",
    signal: "Challenge",
    updated: "14:05",
    evidence: "ev_asml_supplier",
  },
  {
    id: "discovery-05",
    title: "Final allocation retains 50% cash after the risk resize",
    detail: "30% Nvidia · 20% Siemens Energy · 62% confidence",
    agent: "Portfolio Manager",
    signal: "Revision",
    updated: "14:05",
    evidence: "rec_final",
  },
  {
    id: "discovery-06",
    title: "Internal report generated only after explicit human approval",
    detail: "Two paper orders recorded; no real-money trade",
    agent: "Report Writer",
    signal: "Post-decision",
    updated: "14:06",
    evidence: "rpt_main",
  },
]

function AgentActivityChart() {
  return (
    <Card className="border-0 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Research activity</CardTitle>
        <CardDescription>Synthetic committee run · six-minute replay</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activityChartConfig} className="h-64 w-full aspect-auto">
          <AreaChart
            accessibilityLayer
            data={researchActivity}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDiscoveries" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-discoveries)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-discoveries)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillEvidenceLinks" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-evidenceLinks)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-evidenceLinks)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="evidenceLinks"
              type="natural"
              fill="url(#fillEvidenceLinks)"
              fillOpacity={0.4}
              stroke="var(--color-evidenceLinks)"
              stackId="activity"
            />
            <Area
              dataKey="discoveries"
              type="natural"
              fill="url(#fillDiscoveries)"
              fillOpacity={0.4}
              stroke="var(--color-discoveries)"
              stackId="activity"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 text-sm font-medium">
          4 material findings from 6 evidence-linked records
          <TrendingUp className="size-4" aria-hidden="true" />
        </div>
      </CardFooter>
    </Card>
  )
}

function LatestDiscoveriesTable() {
  return (
    <section className="space-y-3" aria-labelledby="latest-discoveries-title">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="latest-discoveries-title"
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Latest agent discoveries
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono">{latestDiscoveries.length}</span>
          <span>fixture records</span>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border-border/70 bg-card/40 p-0 shadow-none">
        <Table className="min-w-[760px] table-fixed">
          <colgroup>
            <col className="w-[44%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4">Discovery</TableHead>
              <TableHead className="px-4">Agent</TableHead>
              <TableHead className="px-4">Signal</TableHead>
              <TableHead className="px-4">Updated</TableHead>
              <TableHead className="px-4">Evidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestDiscoveries.map((discovery) => (
              <TableRow key={discovery.id} className="h-[53px]">
                <TableCell className="px-4 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{discovery.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {discovery.detail}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                  {discovery.agent}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Badge variant="outline">{discovery.signal}</Badge>
                </TableCell>
                <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {discovery.updated}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Badge variant="secondary">{discovery.evidence}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}

export function SaloonOverview({ onOpenRoom }: { onOpenRoom: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Saloon
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review fixture activity, then enter the room to inspect each agent.
          </p>
        </div>
        <Button className="shrink-0" onClick={onOpenRoom}>
          Open the room
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-0 shadow-none ring-0">
          <CardHeader>
            <CardTitle>Agent work completed</CardTitle>
            <CardDescription>
              Completed operations in the current fixture replay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedChart
              columns={agentWork}
              maxValue={4}
              titleClassName="text-[10px] leading-tight [overflow-wrap:anywhere] sm:text-xs"
              className="h-64 overflow-hidden rounded-xl border-0"
            />
          </CardContent>
        </Card>

        <AgentActivityChart />
      </div>

      <LatestDiscoveriesTable />
    </main>
  )
}
