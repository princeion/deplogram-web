import type { BuildLogLine, BuildStep, Deployment, DeploymentLogs, LogStepId } from "@/features/deployments/deployments"
import { mockDeploymentTimeline } from "@/mocks/data/deployments"

type Outcome = "succeeded" | "build_failed" | "deploy_failed" | "crashed"
type Entry = [offsetMs: number, step: LogStepId, text: string, stream?: "stdout" | "stderr"]

const stepLabels: Record<LogStepId, string> = {
  clone: "Clone repository",
  install: "Install dependencies",
  build: "Build",
  deploy: "Deploy",
  runtime: "Runtime",
}

const runtimeLines: Record<string, { label: string; install: string[]; build: string[] }> = {
  nextjs: {
    label: "Next.js · Node.js 22",
    install: ["$ npm ci"],
    build: ["$ next build", "  ▲ Next.js 16.3.6", "  Creating an optimized production build …", "  ✓ Compiled successfully in 4.1s", "  ✓ Generating static pages (12/12)", "  Route (app)                 Size     First Load JS", "  ┌ ○ /                      5.2 kB         118 kB", "  ├ ƒ /api/orders            0 B            0 B", "  └ ○ /settings              3.9 kB         116 kB"],
  },
  node: {
    label: "Node.js 22",
    install: ["$ npm ci"],
    build: ["$ npm run build", "> orders-api@1.4.0 build", "> tsc -p tsconfig.build.json", "  Compiled 84 files to dist/"],
  },
  static: {
    label: "Static site",
    install: ["No install step for static sites — skipping"],
    build: ["$ npx docusaurus build", "  [INFO] Creating an optimized production build …", "  [SUCCESS] Generated static files in build/"],
  },
}

/** The full log a deployment would produce, with millisecond offsets from its start. */
function script(deployment: Deployment, kind: "build" | "rollback", outcome: Outcome): Entry[] {
  const host = deployment.url ?? `${deployment.projectName}.dpl.app`
  const { buildCommand, startCommand, port } = deployment.config
  // Static sites are published as files; everything else starts a container on its port.
  const start: [string, string] = port
    ? [`Starting container (512 MB · 0.5 vCPU): ${startCommand ?? "default start command"}`, `Listening on port ${port}`]
    : ["Publishing static files to storage", "Static files published (46 files)"]
  const healthy = port ? "Health check GET / → 200 in 71ms" : "Edge check GET / → 200 in 18ms"
  if (kind === "rollback") {
    return [
      [0, "deploy", `Rolling back to ${deployment.commit.sha} — reusing its build, nothing to rebuild`],
      [600, "deploy", start[0]],
      [1400, "deploy", start[1]],
      [1900, "deploy", healthy],
      [3000, "deploy", `Routing traffic to ${deployment.id}`],
      [3800, "deploy", `Deployment is live at https://${host}`],
    ]
  }

  const rt = runtimeLines[deployment.runtime] ?? runtimeLines.node
  const entries: Entry[] = [
    [3000, "clone", `Cloning github.com/ada/${deployment.projectName} (branch ${deployment.commit.branch}, commit ${deployment.commit.sha})`],
    [3400, "clone", "Cloned in 0.4s"],
    [3600, "clone", `Detected runtime: ${rt.label}`],
    [3900, "install", rt.install[0]],
  ]
  if (deployment.runtime !== "static") {
    entries.push(
      [4600, "install", "npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory.", "stderr"],
      [5800, "install", "added 312 packages, and audited 313 packages in 2s"],
      [6300, "install", "found 0 vulnerabilities"],
      [6700, "install", "Restored build cache (148 MB)"]
    )
  }
  // The configured build command, then what the tool prints.
  ;[`$ ${buildCommand ?? "no build command"}`, ...rt.build.slice(1)].forEach((line, i) => entries.push([7000 + i * 280, "build", line]))

  if (outcome === "build_failed") {
    entries.push(
      [8900, "build", "Error: Cannot find module './components/Search'", "stderr"],
      [8920, "build", "    at resolveImport (src/theme/Navbar.tsx:4:24)", "stderr"],
      [8940, "build", "    at build (node_modules/@docusaurus/core/lib/commands/build.js:58:11)", "stderr"],
      [9000, "build", "Build failed with exit code 1", "stderr"]
    )
    return entries
  }

  entries.push(
    [9800, "build", "Build completed in 2.8s"],
    [10200, "deploy", "Uploading build output (6.2 MB)"],
    [11600, "deploy", "Build output uploaded"],
    [12000, "deploy", start[0]],
    [12900, "deploy", start[1]]
  )
  if (outcome === "deploy_failed") {
    entries.push(
      [13400, "deploy", "Health check GET / → 502 (attempt 1 of 3)", "stderr"],
      [14200, "deploy", "Health check GET / → 502 (attempt 2 of 3)", "stderr"],
      [15000, "deploy", "Health check GET / → 502 (attempt 3 of 3)", "stderr"],
      [15200, "deploy", `Deploy failed: the app didn't answer health checks on port ${port}. Check the start command and port.`, "stderr"]
    )
    return entries
  }
  entries.push(
    [13800, "deploy", healthy],
    [15000, "deploy", `Routing traffic to ${deployment.id}`],
    [15800, "deploy", `Deployment is live at https://${host}`]
  )
  if (outcome === "crashed") {
    entries.push(
      [17000, "runtime", "GET /api/orders 200 in 42ms"],
      [18200, "runtime", "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory", "stderr"],
      [18300, "runtime", "Process exited with code 134", "stderr"]
    )
  }
  return entries
}

function outcomeOf(state: Deployment["state"], fails: boolean): Outcome {
  if (fails || state === "BUILD_FAILED") return "build_failed"
  if (state === "DEPLOY_FAILED") return "deploy_failed"
  if (state === "CRASHED") return "crashed"
  return "succeeded"
}

/** GET /v1/deployments/:id/logs?after=n for the mock. */
export function mockDeploymentLogs(deployment: Deployment, after = 0, now = Date.now()): DeploymentLogs {
  const timeline = mockDeploymentTimeline(deployment.id)
  const kind = timeline?.kind ?? (deployment.trigger === "rollback" ? "rollback" : "build")
  const inProgress = ["QUEUED", "BUILDING", "BUILT", "DEPLOYING"].includes(deployment.state)
  const entries = script(deployment, kind, outcomeOf(deployment.state, timeline?.fails ?? false))

  // Live deployments replay their script in real time; settled ones are stretched over their duration.
  const start = timeline?.startedAt ?? new Date(deployment.createdAt).getTime()
  const lastOffset = entries.at(-1)![0]
  const scale = timeline || !deployment.durationSeconds ? 1 : (deployment.durationSeconds * 1000) / Math.max(1, lastOffset)
  const elapsed = now - start

  const visible = entries.filter(([offset]) => !inProgress || offset <= elapsed)
  const lines: BuildLogLine[] = visible.map(([offset, step, text, stream = "stdout"], i) => ({
    n: i + 1,
    at: new Date(start + offset * scale).toISOString(),
    step,
    stream,
    text,
  }))

  const order: LogStepId[] = kind === "rollback" ? ["deploy"] : ["clone", "install", "build", "deploy", ...(entries.some(([, s]) => s === "runtime") ? (["runtime"] as const) : [])]
  const failed = ["BUILD_FAILED", "DEPLOY_FAILED", "CRASHED"].includes(deployment.state)
  const lastStep = lines.at(-1)?.step
  const steps: BuildStep[] = order.map((id) => {
    const own = lines.filter((l) => l.step === id)
    const isLast = id === lastStep
    const state: BuildStep["state"] =
      own.length === 0 ? (failed || (!inProgress && !failed) ? "skipped" : "pending") : isLast && inProgress ? "running" : isLast && failed ? "failed" : "succeeded"
    return { id, label: stepLabels[id], state, startedAt: own[0]?.at ?? null, endedAt: state === "running" ? null : (own.at(-1)?.at ?? null) }
  })

  return { lines: lines.filter((l) => l.n > after), steps, done: !inProgress }
}
