import type { Metadata } from "next"

import { SignupForm } from "@/components/signup-form"
import { SonarLogo } from "@/components/sonar-logo"

export const metadata: Metadata = {
  title: "Sign up | Sonar AI",
  description: "Create access to the Sonar AI paper fund dashboard.",
}

export default function SignupPage() {
  return (
    <main className="flex min-h-svh flex-col p-6 md:p-10">
      <SonarLogo className="text-foreground" />
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </main>
  )
}
