"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface MandateBoundary {
  name: string
  current: string
  limit: string
  proximity: number
  ariaLabel: string
}

const mandateBoundaries: MandateBoundary[] = [
  {
    name: "Largest position",
    current: "24.8%",
    limit: "30% max",
    proximity: 82.7,
    ariaLabel: "Largest position: current 24.8 percent, limit 30 percent maximum, 82.7 percent proximity to the mandate boundary.",
  },
  {
    name: "Largest sector",
    current: "43.4%",
    limit: "45% max",
    proximity: 96.4,
    ariaLabel: "Largest sector: current 43.4 percent, limit 45 percent maximum, 96.4 percent proximity to the mandate boundary.",
  },
  {
    name: "Cash minimum",
    current: "17.6%",
    limit: "10% min",
    proximity: 56.8,
    ariaLabel: "Cash minimum: current 17.6 percent, limit 10 percent minimum, 56.8 percent proximity to the mandate boundary.",
  },
  {
    name: "Turnover this event",
    current: "€203.7K total",
    limit: "€203.7K max (20% NAV)",
    proximity: 100,
    ariaLabel: "Turnover this event: current total 203.7 thousand euros, limit 203.7 thousand euros maximum, equal to 20 percent of paper NAV, 100 percent proximity to the mandate boundary.",
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
    <Card className="w-full gap-3 border-0 py-5 shadow-none ring-0">
      <CardHeader className="px-5">
        <CardTitle>Mandate boundary proximity</CardTitle>
        <CardDescription>Illustrative presentational fixture · higher means closer to breach</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pt-0">
        <div>
          {mandateBoundaries.map((item, index) => (
            <div
              className={cn(
                "flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-muted/50",
                index % 2 === 1 && "bg-muted/40",
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
