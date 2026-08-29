import type { Metadata } from "next"

import { BorderGlow } from "@/components/border-glow"
import { LoginForm } from "@/components/login-form"
import { SonarLogo } from "@/components/sonar-logo"
import { LiveOrb } from "@/components/ui/live-orb"

export const metadata: Metadata = {
  title: "Sign in | Sonar AI",
  description: "Sign in to the Sonar AI paper fund dashboard.",
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <SonarLogo className="text-foreground" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative isolate hidden items-center justify-center overflow-hidden bg-black lg:flex">
        <div aria-hidden="true" className="absolute inset-12 opacity-30">
          <BorderGlow
            animated={false}
            backgroundColor="#000000"
            borderRadius={28}
            className="size-full"
            colors={["#39bdd1", "#8fbed2", "#ffffff"]}
            coneSpread={24}
            edgeSensitivity={30}
            fillOpacity={0.35}
            glowColor="190 70 70"
            glowIntensity={0.7}
            glowRadius={32}
          >
            <div className="flex h-full flex-col justify-between p-8 font-mono text-[11px] tracking-[0.14em] text-white uppercase">
              <div className="flex items-center justify-between">
                <span>Sonar paper fund</span>
                <span>Historical replay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-14 gap-y-8">
                <div>
                  <p className="text-white/55">Paper NAV</p>
                  <p className="mt-1 text-base tracking-normal">€1,018,420</p>
                </div>
                <div className="text-right">
                  <p className="text-white/55">Gross exposure</p>
                  <p className="mt-1 text-base tracking-normal">82.4%</p>
                </div>
                <div>
                  <p className="text-white/55">Available cash</p>
                  <p className="mt-1 text-base tracking-normal">€179,210</p>
                </div>
                <div className="text-right">
                  <p className="text-white/55">Risk status</p>
                  <p className="mt-1 text-base tracking-normal">Within limits</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-white/65">
                <span>Paper trading only</span>
                <span>Human approval required</span>
              </div>
            </div>
          </BorderGlow>
        </div>
        <LiveOrb
          blink
          className="relative z-10 drop-shadow-[0_28px_44px_rgba(255,255,255,0.12)]"
          interactive
          size={176}
          variant="white"
        />
      </div>
    </main>
  )
}
