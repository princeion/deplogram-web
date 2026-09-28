import type { IconName } from "@/content/types"

export type Runtime = {
  name: string
  /** Frameworks covered, shown after the name. */
  detail?: string
  icon: IconName
}

// TODO: swap icons for official runtime marks once we have licensed logo assets.
export const runtimes: readonly Runtime[] = [
  { name: "Node.js", icon: "hexagon" },
  { name: "Next.js", icon: "layers" },
  { name: "Vite", detail: "React · Vue · Svelte", icon: "zap" },
  { name: "Python", detail: "FastAPI · Flask", icon: "braces" },
  { name: "PHP", detail: "Laravel", icon: "file-code" },
  { name: "Go", icon: "gauge" },
  { name: "Static sites", icon: "file-text" },
  { name: "Docker", detail: "anything containerised", icon: "container" },
]
