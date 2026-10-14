import { cn } from "cn"

/**
 * Loading placeholder — the default way to show that content is on its way. Use a skeleton
 * whenever the shape of what's loading is known (text, avatars, cards, rows, whole pages); keep
 * spinners for actions in progress. A soft highlight drifts across slowly; it holds still for
 * reduced motion.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-muted bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--foreground)_7%,transparent),transparent)] bg-size-[60%_100%] bg-no-repeat motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

/** Lines of text; the last line is shorter, like a real paragraph. */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div data-slot="skeleton-text" aria-hidden className={cn("grid gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  )
}

/** Round placeholder for avatars and status icons. */
function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("size-8 rounded-full", className)} />
}

export { Skeleton, SkeletonAvatar, SkeletonText }
