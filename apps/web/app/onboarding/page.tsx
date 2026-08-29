import type { Metadata } from "next"

import { OnboardingIntro } from "@/features/onboarding/onboarding-intro"

export const metadata: Metadata = {
  title: "Welcome | Sonar AI",
  description: "Initialize the Sonar AI paper fund.",
}

export default function OnboardingPage() {
  return <OnboardingIntro />
}
