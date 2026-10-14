"use client"

import * as React from "react"

import { AppLoader } from "@/components/app-shell/app-loader"

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled"

let workerStart: Promise<unknown> | undefined

/**
 * Starts the worker once per page. React runs effects twice in development (Strict Mode); a
 * second `worker.start()` throws, and without this shared promise the app would render before the
 * first start finished — sending its first requests past the mocks.
 */
function startWorker() {
  workerStart ??= import("@/mocks/browser").then(({ worker }) => worker.start({ onUnhandledFrame: "bypass", quiet: true }))
  return workerStart
}

/**
 * Starts the MSW service worker before rendering, when mocking is enabled, so the first requests
 * are already intercepted. With mocking off it renders children straight away; the worker code is
 * only loaded when needed. If the worker can't start (service workers blocked, private mode),
 * the app still renders — requests just aren't mocked.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!mockingEnabled)

  React.useEffect(() => {
    if (!mockingEnabled) return
    let cancelled = false
    const done = () => !cancelled && setReady(true)
    // Never block the app for long on the worker.
    const timeout = window.setTimeout(done, 10_000)

    startWorker()
      .catch((error) => console.warn("[msw] mock API not started:", error))
      .finally(() => {
        window.clearTimeout(timeout)
        done()
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  return ready ? children : <AppLoader />
}
