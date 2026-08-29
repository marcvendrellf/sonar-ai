"use client"

import { useSyncExternalStore } from "react"

const DEMO_AUTH_KEY = "sonar-demo-auth"
const DEMO_AUTH_EVENT = "sonar-demo-auth-change"

export type DemoUser = {
  name: string
  email: string
}

function getSnapshot() {
  return window.localStorage.getItem(DEMO_AUTH_KEY)
}

function getServerSnapshot() {
  return null
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(DEMO_AUTH_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(DEMO_AUTH_EVENT, onStoreChange)
  }
}

function parseDemoUser(snapshot: string | null): DemoUser | null {
  if (!snapshot) {
    return null
  }

  try {
    const value: unknown = JSON.parse(snapshot)

    if (
      typeof value !== "object" ||
      value === null ||
      !("name" in value) ||
      typeof value.name !== "string" ||
      !("email" in value) ||
      typeof value.email !== "string"
    ) {
      return null
    }

    return { name: value.name, email: value.email }
  } catch {
    return null
  }
}

function emitAuthChange() {
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

export function useDemoUser() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return parseDemoUser(snapshot)
}

export function saveDemoUser(user: DemoUser) {
  window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(user))
  emitAuthChange()
}

export function clearDemoUser() {
  window.localStorage.removeItem(DEMO_AUTH_KEY)
  emitAuthChange()
}
