import type { Metadata } from "next"

import { Saloon } from "@/features/saloon/saloon"

import "@/features/saloon/saloon.css"

export const metadata: Metadata = {
  title: "Saloon | Sonar AI",
  description: "Inspect the Sonar AI agent operations room.",
}

export default function SaloonPage() {
  return <Saloon />
}
