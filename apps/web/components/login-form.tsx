"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { saveDemoUser } from "@/lib/client/demo-auth"
import { cn } from "@/lib/utils"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const submittedEmail = String(formData.get("email") ?? "").trim()
    const email = submittedEmail || "demo@sonar.ai"
    const displayName = submittedEmail
      ? submittedEmail.split("@")[0] || "User"
      : "Demo user"

    saveDemoUser({ name: displayName, email })
    router.replace("/dashboard")
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      noValidate
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">Continue to your paper fund.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            autoComplete="email"
            id="login-email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            autoComplete="current-password"
            id="login-password"
            name="password"
            type="password"
          />
        </Field>
        <Field>
          <Button type="submit">Sign in</Button>
          <FieldDescription className="text-center">
            New to Sonar? <Link href="/signup">Create an account</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
