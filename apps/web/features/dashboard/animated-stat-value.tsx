"use client"

import {
  animateSlotText,
  buildSlotText,
  clearSlotText,
} from "slot-text"
import { useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type AnimatedStatValueProps = {
  className?: string
  initialValue: string
  value: string
}

export function AnimatedStatValue({
  className,
  initialValue,
  value,
}: AnimatedStatValueProps) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const element = valueRef.current

    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    buildSlotText(element, initialValue)

    const animationFrame = window.requestAnimationFrame(() => {
      animateSlotText(element, value, {
        bounce: 0.35,
        direction: "up",
        duration: 360,
        stagger: 30,
      })
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      clearSlotText(element, value)
    }
  }, [initialValue, value])

  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={valueRef}>
        {value}
      </span>
    </span>
  )
}
