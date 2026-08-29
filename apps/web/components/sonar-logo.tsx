import Link from "next/link"

import { cn } from "@/lib/utils"

type SonarLogoProps = {
  className?: string
}

type SonarMarkProps = {
  className?: string
}

export function SonarMark({ className }: SonarMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 16 24"
    >
      <rect fill="currentColor" height="18" rx="1.75" width="3.5" x="2" y="3" />
      <rect fill="currentColor" height="18" rx="1.75" width="3.5" x="10.5" y="3" />
    </svg>
  )
}

export function SonarLogo({ className }: SonarLogoProps) {
  return (
    <Link
      aria-label="Go to overview"
      className={cn(
        "flex min-w-0 items-center gap-2.5 px-1 py-1 text-sidebar-foreground transition-opacity hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
      href="/dashboard"
    >
      <SonarMark className="h-6 w-4 shrink-0 translate-y-px" />
      <span className="truncate font-heading text-2xl font-semibold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
        Sonar
      </span>
    </Link>
  )
}
