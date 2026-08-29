import type { Metadata } from "next"

import { ApplicationShell1 } from "@/components/application-shell1"
import { Saloon } from "@/features/saloon/saloon"

import "@/features/saloon/saloon.css"

export const metadata: Metadata = {
  title: "Saloon | Sonar AI",
  description: "Inspect the Sonar AI agent operations room.",
}

export default function SaloonPage() {
  return (
    <ApplicationShell1>
      <Saloon />
    </ApplicationShell1>
  )
}
