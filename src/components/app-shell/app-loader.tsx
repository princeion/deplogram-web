import { cn } from "@/lib/utils"

/**
 * Full-screen loader for the app as a whole — while the app boots or the workspace connects.
 * A brushed-metal ring turns slowly; a highlight sweeps through the message. For anything with a
 * known shape (pages, lists, cards), use skeletons instead.
 */
export function AppLoader({ message = "Connecting to Your Galley", className }: { message?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex min-h-svh flex-col items-center justify-center gap-6 bg-background", className)}>
      <span aria-hidden className="relative size-20">
        {/* Faint track. */}
        <span className="absolute inset-0 rounded-full ring-[5px] ring-foreground/10 ring-inset" />
        {/* The metal: a conic gradient with two highlights, masked to a thin ring, turning. */}
        <span
          className="absolute inset-0 animate-spin rounded-full [animation-duration:1.8s] motion-reduce:[animation-duration:4s]"
          style={{
            background:
              "conic-gradient(from 0deg, color-mix(in oklab, var(--foreground) 30%, transparent), var(--foreground) 22%, color-mix(in oklab, var(--foreground) 30%, transparent) 45%, color-mix(in oklab, var(--foreground) 85%, transparent) 72%, color-mix(in oklab, var(--foreground) 30%, transparent))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4.5px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4.5px))",
          }}
        />
      </span>
      <p
        className="animate-text-shimmer bg-[linear-gradient(110deg,var(--muted-foreground)_40%,var(--brand)_50%,var(--muted-foreground)_60%)] bg-size-[250%_100%] bg-clip-text text-base font-medium text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-muted-foreground"
      >
        {message}
      </p>
    </div>
  )
}
