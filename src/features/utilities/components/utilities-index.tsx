import Link from "next/link"

import { utilityList } from "@/features/utilities/utilities"
import { Icon } from "@/components/shared/icon"

/** Every utility as a card: what it does, and a taste of its input. */
export function UtilitiesIndex() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {utilityList.map((tool) => (
        <li key={tool.id}>
          <Link
            href={`/dashboard/utilities/${tool.id}`}
            className="group flex h-full flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 transition-colors outline-none hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <span className="flex items-start gap-3">
              <span className="surface-sunken grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors group-hover:text-brand-ink">
                <Icon name={tool.icon} size="md" />
              </span>
              <span className="grid min-w-0 gap-1">
                <span className="flex items-center gap-2 font-medium">
                  {tool.title}
                  <Icon name="arrow-right" size="xs" className="text-muted-foreground opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
                <span className="text-sm text-pretty text-muted-foreground">{tool.description}</span>
              </span>
            </span>
            <span className="surface-sunken mt-auto flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-mono text-xs">
              <span className="truncate text-foreground/80">{tool.sample}</span>
              <span className="shrink-0 font-sans text-muted-foreground">{tool.local ? "in your browser" : "uses a URL"}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
