import { cn } from "cn"

/**
 * Loading placeholder — the default way to show that content is on its way. Use a skeleton
 * whenever the shape of what's loading is known (text, avatars, cards, rows, whole pages); keep
 * spinners for actions in progress. One beam of light sweeps across every skeleton on screen
 * together (see the `skeleton` utility in globals.css); it holds still for reduced motion.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("skeleton rounded-md", className)} {...props} />
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
