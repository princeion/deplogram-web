"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { DocsNavSection } from "@/content/docs"

/** Docs navigation. Items without an href are listed as upcoming, not linked (no dead links). */
export function DocsSidebar({ sections }: { sections: readonly DocsNavSection[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-8 text-sm lg:sticky lg:top-28 lg:self-start">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">{section.title}</p>
          <ul className="flex flex-col gap-0.5 border-l border-border">
            {section.items.map((item) =>
              item.href ? (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-brand-ink aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ) : (
                <li key={item.title} className="flex items-center justify-between gap-2 py-1.5 pl-4 text-muted-foreground/60">
                  {item.title}
                  <span className="rounded-full border border-border px-1.5 text-[0.625rem] tracking-wide uppercase">
                    soon
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </nav>
  )
}
