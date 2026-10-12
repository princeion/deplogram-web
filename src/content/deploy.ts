import type { FeatureItem } from "@/content/types"

/** The deploy flow (brief §3 "Deploy screen"): source → runtime → configure → deploy → live. */
export const deploySteps: readonly { id: string; title: string; summary: string; detail: string }[] = [
  {
    id: "source",
    title: "Source",
    summary: "GitHub, repository, branch.",
    detail: "Connect GitHub, pick the repository and the branch to deploy.",
  },
  {
    id: "runtime",
    title: "Runtime",
    summary: "One of eight runtimes.",
    detail: "Vite, Next.js, Node.js, Python, PHP, Go, Static Sites or Docker. Your stack, your choice.",
  },
  {
    id: "configure",
    title: "Configure",
    summary: "Name, commands, port, env.",
    detail: "Project name, build command, start command, port and environment variables. Nothing else.",
  },
  {
    id: "deploy",
    title: "Deploy",
    summary: "Clear progress and logs.",
    detail: "Watch every stage of the build and rollout, with the logs right there.",
  },
  {
    id: "live",
    title: "Live",
    summary: "A URL and the controls.",
    detail: "Your project is live — with its deployment URL and the actions to manage it.",
  },
]

export type LifecycleState = "QUEUED" | "BUILDING" | "BUILT" | "DEPLOYING" | "RUNNING"
export type FailureState = "BUILD_FAILED" | "DEPLOY_FAILED" | "CRASHED"

/** Brief §5 — the recommended lifecycle, and the explicit failure states. */
export const lifecycle: readonly { state: LifecycleState; description: string }[] = [
  { state: "QUEUED", description: "Accepted and waiting for a builder." },
  { state: "BUILDING", description: "Installing, compiling, generating artifacts." },
  { state: "BUILT", description: "The artifact is packaged and preserved." },
  { state: "DEPLOYING", description: "Starting your process and wiring the URL." },
  { state: "RUNNING", description: "Healthy and serving traffic." },
]

export const failureStates: readonly { state: FailureState; after: LifecycleState; description: string }[] = [
  { state: "BUILD_FAILED", after: "BUILDING", description: "The build stopped. The logs say exactly where." },
  { state: "DEPLOY_FAILED", after: "DEPLOYING", description: "It built, but it didn't start. Not the same thing." },
  { state: "CRASHED", after: "RUNNING", description: "It was running, then it wasn't. Health checks noticed." },
]

/** Build time vs run time (brief §5). */
export const buildVsRun = {
  build: {
    title: "Build time",
    description: "Everything that turns a repository into something runnable.",
    points: ["Dependency installation", "Compilation", "Framework builds", "Artifact generation"],
  },
  run: {
    title: "Run time",
    description: "Everything that keeps it alive once it's live.",
    points: ["The persistent process or container", "CPU and RAM", "Storage", "Network behaviour"],
  },
} as const

/** What the backend owns so the deploy screen can stay simple (brief §5). */
export const backendResponsibilities: readonly FeatureItem[] = [
  { title: "Runtime detection", description: "Identify — or respect — the runtime you picked and your project structure.", icon: "scan-search" },
  { title: "Dependency installation", description: "Install packages with the right ecosystem tooling.", icon: "package" },
  { title: "Build engine", description: "Run default or custom build commands, within limits.", icon: "hammer" },
  { title: "Artifact handling", description: "Package and preserve exactly what the deployment needs.", icon: "archive" },
  { title: "Runtime orchestration", description: "Start, monitor, restart and stop deployed workloads.", icon: "workflow" },
  { title: "Ports & routing", description: "Expose your app through its Deplogram deployment URL.", icon: "network" },
  { title: "Environment variables", description: "Inject configuration securely into builds and runtimes.", icon: "variable" },
  { title: "Logs", description: "Build and runtime logs, in the same place you deployed from.", icon: "scroll-text" },
  { title: "Health checks", description: "Detect unhealthy or crashed applications.", icon: "heart-pulse" },
]

/** Illustrative build output for the Deploy step of the console mock. */
export const deployLog: readonly { at: string; text: string; tone?: "muted" | "brand" | "success" }[] = [
  { at: "00:00", text: "QUEUED · waiting for a builder", tone: "muted" },
  { at: "00:01", text: "cloning github.com/ada/orders-api@main" },
  { at: "00:03", text: "BUILDING · runtime node" },
  { at: "00:04", text: "npm ci — 214 packages", tone: "muted" },
  { at: "00:19", text: "npm run build" },
  { at: "00:31", text: "BUILT · artifact packaged", tone: "brand" },
  { at: "00:32", text: "DEPLOYING · starting on port 8080" },
  { at: "00:35", text: "health check passed", tone: "muted" },
  { at: "00:36", text: "RUNNING · orders-api.dpl.app", tone: "success" },
]
