"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { saveDemoUser } from "@/lib/client/demo-auth"

export function SignupForm(props: React.ComponentProps<typeof Card>) {
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const submittedName = String(formData.get("name") ?? "").trim()
    const submittedEmail = String(formData.get("email") ?? "").trim()

    saveDemoUser({
      name: submittedName || "Demo user",
      email: submittedEmail || "demo@sonar.ai",
    })
    router.replace("/dashboard")
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>Set up your Sonar paper fund access.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
              <Input
                autoComplete="name"
                id="signup-name"
                name="name"
                placeholder="Alex Morgan"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="signup-email"
                name="email"
                placeholder="you@example.com"
                type="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="signup-password"
                name="password"
                type="password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm-password">Confirm password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
              />
            </Field>
            <Field>
              <Button type="submit">Create account</Button>
              <FieldDescription className="text-center">
                Already have an account? <Link href="/login">Sign in</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
