import Link from "next/link"

import { cn } from "@/lib/utils"

type SonarLogoProps = {
  className?: string
}

type SonarMarkProps = {
  className?: string
}

function SonarMark({ className }: SonarMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
    >
      <circle cx="6" cy="16" fill="currentColor" r="2.25" />
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      >
        <path d="M11 10.5a7.5 7.5 0 0 1 0 11" />
        <path d="M16 6.5a13 13 0 0 1 0 19" opacity="0.76" />
        <path d="M21 3a18 18 0 0 1 0 26" opacity="0.48" />
      </g>
    </svg>
  )
}

export function SonarLogo({ className }: SonarLogoProps) {
  return (
    <Link
      aria-label="Go to overview"
      className={cn(
        "flex min-w-0 items-center gap-3 px-1 py-1 text-sidebar-foreground transition-opacity hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
      href="#dashboard"
    >
      <SonarMark className="size-9 shrink-0 group-data-[collapsible=icon]:size-8" />
      <span className="truncate font-heading text-3xl font-semibold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
        Sonar
      </span>
    </Link>
  )
}
