import * as React from "react"

import { cn } from "@/lib/utils"

type MarqueeProps = {
  children: React.ReactNode
  className?: string
  /** One full loop. */
  duration?: `${number}s`
}

/**
 * Infinite horizontal scroll — CSS transform keyframes over duplicated content (no JS).
 * Pauses on hover; reduced motion → a static, wrapped, centred row.
 */
export function Marquee({ children, className, duration = "40s" }: MarqueeProps) {
  return (
    <div className={cn("group relative flex overflow-hidden mask-fade-x motion-reduce:mask-none", className)}>
      <div
        className="flex w-max shrink-0 animate-marquee gap-3 pr-3 group-hover:animate-paused motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center"
        style={{ "--marquee-duration": duration } as React.CSSProperties}
      >
        <div className="flex shrink-0 gap-3 motion-reduce:flex-wrap motion-reduce:justify-center">{children}</div>
        <div className="flex shrink-0 gap-3 motion-reduce:hidden" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
