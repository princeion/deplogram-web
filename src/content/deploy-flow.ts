import type { TerminalLine } from "@/components/shared/motion/terminal-typing"

/**
 * The core deploy flow as terminal output, typed by the deploy demo in sync with the pipeline graph.
 * `step` values map to NODE_GRAPH_LAYOUTS.pipeline.order — push, detect, build, env, domain, ssl, deploy, live.
 */
export const deployLog: readonly TerminalLine[] = [
  { kind: "command", text: "git push origin main", step: 1 },
  { kind: "info", text: "detected Next.js · bun", step: 2 },
  { kind: "muted", text: "installing dependencies…" },
  { kind: "info", text: "build completed", step: 3 },
  { kind: "info", text: "env vars injected", step: 4 },
  { kind: "info", text: "domain myapp.dpl.app assigned", step: 5 },
  { kind: "info", text: "ssl certificate issued", step: 6 },
  { kind: "info", text: "deploying…", step: 7 },
  { kind: "success", text: "Live at https://myapp.dpl.app", step: 8 },
]
