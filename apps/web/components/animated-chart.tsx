"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

interface ColumnData {
  id: string
  title: string
  value: number
  prependString?: string
  appendString?: string
  animationDuration?: number
  animationDelay?: number
  className?: string
  topBorderClassName?: string
  titleClassName?: string
  valueClassName?: string
}

interface AnimatedChartProps extends React.ComponentPropsWithoutRef<"div"> {
  columns: ColumnData[]
  maxValue: number
  titleClassName?: string
  valueClassName?: string
  restartOnDataChange?: boolean
}

interface AnimatedChartColumnProps extends React.ComponentPropsWithoutRef<"div"> {
  column: ColumnData
  maxValue: number
  titleClassName?: string
  valueClassName?: string
  isInView: boolean
  isLast: boolean
  reducedMotion: boolean
}

function AnimatedChartColumn({
  column,
  maxValue,
  titleClassName,
  valueClassName,
  isInView,
  isLast,
  reducedMotion,
  className,
  ...props
}: AnimatedChartColumnProps) {
  const heightPercentage = maxValue > 0 ? Math.min((column.value / maxValue) * 100, 100) : 0
  const duration = reducedMotion ? 0 : (column.animationDuration ?? 0.8)
  const delay = reducedMotion ? 0 : (column.animationDelay ?? 0)

  return (
    <div
      data-slot="animated-charts-column"
      className={cn("relative flex flex-1 flex-col", !isLast && "border-r", className)}
      {...props}
    >
      <div className="flex min-h-12 items-start px-1 py-2 sm:px-2 lg:px-3">
        <span className={cn("block min-w-0 text-xs font-medium text-muted-foreground", titleClassName, column.titleClassName)}>
          {column.title}
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col justify-end border-t border-border/10">
        <motion.div
          className={cn("relative w-full border-t-2 bg-muted/20", column.className, column.topBorderClassName)}
          initial={{ height: reducedMotion ? `${heightPercentage}%` : 0 }}
          animate={{ height: isInView || reducedMotion ? `${heightPercentage}%` : 0 }}
          transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className={cn("absolute left-3 top-2 text-sm font-medium tabular-nums", valueClassName, column.valueClassName)}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: isInView || reducedMotion ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, delay: delay + duration * 0.55 }}
          >
            {column.prependString}
            {column.value}
            {column.appendString}
          </motion.span>
        </motion.div>
      </div>
    </div>
  )
}

function AnimatedChart({
  columns,
  maxValue,
  titleClassName,
  valueClassName,
  restartOnDataChange = false,
  className,
  ...props
}: AnimatedChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(chartRef, { once: true, amount: 0.35 })
  const reducedMotion = useReducedMotion() ?? false
  const dataKey = restartOnDataChange
    ? columns.map((column) => `${column.id}:${column.value}`).join("|")
    : "stable"

  return (
    <div
      ref={chartRef}
      data-slot="animated-charts"
      className={cn("flex w-full border", className)}
      {...props}
    >
      {columns.map((column, index) => (
        <AnimatedChartColumn
          key={`${column.id}:${dataKey}`}
          column={column}
          maxValue={maxValue}
          titleClassName={titleClassName}
          valueClassName={valueClassName}
          isInView={isInView}
          isLast={index === columns.length - 1}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  )
}

export { AnimatedChart, AnimatedChartColumn }
export type { AnimatedChartProps, AnimatedChartColumnProps, ColumnData }
