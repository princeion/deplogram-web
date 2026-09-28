import * as React from "react"

import { cn } from "@/lib/utils"

/** Section eyebrow: mono, uppercase, tracked, brand ink. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-medium tracking-eyebrow text-brand-ink uppercase", className)}>
      {children}
    </p>
  )
}
