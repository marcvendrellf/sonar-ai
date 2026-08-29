"use client"

import { Cell, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type ChartConfig, ChartContainer } from "@/components/ui/chart"
import { committeeDemo } from "@/fixtures/committee-demo"
import { cn } from "@/lib/utils"

interface MandateBoundary {
  name: string
  current: string
  limit: string
  proximity: number
  ariaLabel: string
}

const percentFormatter = new Intl.NumberFormat("en-IE", {
  style: "percent",
  maximumFractionDigits: 0,
})

const limits = committeeDemo.mandate.limits
const metrics = committeeDemo.riskReport?.metrics
const largestSector = Math.max(0, ...Object.values(metrics?.sectorExposure ?? {}))
const concentration = metrics?.concentration ?? 0
const cashRatio = metrics?.cashRatio ?? 1
const turnover = metrics?.turnover ?? 0

function maximumProximity(current: number, limit: number) {
  return limit > 0 ? Math.min(100, (current / limit) * 100) : 100
}

function minimumProximity(current: number, limit: number) {
  return current > 0 ? Math.min(100, (limit / current) * 100) : 100
}

const mandateBoundaries: MandateBoundary[] = [
  {
    name: "Largest position",
    current: percentFormatter.format(concentration),
    limit: `${percentFormatter.format(limits.maxGrossExposurePerPosition)} max`,
    proximity: maximumProximity(
      concentration,
      limits.maxGrossExposurePerPosition
    ),
    ariaLabel: `Largest position is ${percentFormatter.format(concentration)} against a ${percentFormatter.format(limits.maxGrossExposurePerPosition)} maximum.`,
  },
  {
    name: "Largest sector",
    current: percentFormatter.format(largestSector),
    limit: `${percentFormatter.format(limits.maxSectorExposure)} max`,
    proximity: maximumProximity(largestSector, limits.maxSectorExposure),
    ariaLabel: `Largest sector is ${percentFormatter.format(largestSector)} against a ${percentFormatter.format(limits.maxSectorExposure)} maximum.`,
  },
  {
    name: "Cash minimum",
    current: percentFormatter.format(cashRatio),
    limit: `${percentFormatter.format(limits.minCashRatio)} min`,
    proximity: minimumProximity(cashRatio, limits.minCashRatio),
    ariaLabel: `Cash is ${percentFormatter.format(cashRatio)} against a ${percentFormatter.format(limits.minCashRatio)} minimum.`,
  },
  {
    name: "Sell-side turnover",
    current: percentFormatter.format(turnover),
    limit: `${percentFormatter.format(limits.maxTurnoverPerEvent)} max`,
    proximity: maximumProximity(turnover, limits.maxTurnoverPerEvent),
    ariaLabel: `Sell-side turnover is ${percentFormatter.format(turnover)} against a ${percentFormatter.format(limits.maxTurnoverPerEvent)} maximum.`,
  },
]

const chartConfig = {
  proximity: {
    label: "Boundary proximity",
    color: "var(--sonar-blue)",
  },
  capacity: {
    label: "Distance from boundary",
    color: "var(--muted)",
  },
} satisfies ChartConfig

function BoundaryDonut({ proximity, ariaLabel }: { proximity: number; ariaLabel: string }) {
  const clampedProximity = Math.max(0, Math.min(100, Number(proximity)))
  const data = [
    { name: "proximity", value: clampedProximity, fill: "var(--sonar-blue)" },
    { name: "capacity", value: 100 - clampedProximity, fill: "var(--muted)" },
  ]

  return (
    <ChartContainer
      role="img"
      aria-label={ariaLabel}
      className="size-7 shrink-0"
      config={chartConfig}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          endAngle={-270}
          innerRadius={7}
          isAnimationActive={false}
          nameKey="name"
          outerRadius={11}
          startAngle={90}
          stroke="transparent"
        >
          {data.map((entry) => (
            <Cell fill={entry.fill} key={entry.name} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export function MandateUtilization() {
  return (
    <Card className="w-full gap-3 py-5">
      <CardHeader className="px-5">
        <CardTitle>Core mandate boundaries</CardTitle>
        <CardDescription>Defaults selected during onboarding</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pt-0">
        <div>
          {mandateBoundaries.map((item, index) => (
            <div
              className={cn(
                "flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-muted/50",
                index % 2 === 1 && "bg-muted/40"
              )}
              key={item.name}
            >
              <BoundaryDonut ariaLabel={item.ariaLabel} proximity={item.proximity} />
              <span className="min-w-0 flex-1 text-sm leading-4">{item.name}</span>
              <span className="max-w-[58%] text-right text-xs font-medium tabular-nums tracking-tight text-muted-foreground">
                {item.current} / <span className="text-foreground">{item.limit}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
