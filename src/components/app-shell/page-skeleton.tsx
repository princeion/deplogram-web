import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { pageContainerClass, pageWidths, type PageWidth } from "@/components/app-shell/page"

type PageSkeletonVariant = "cards" | "table" | "detail"

/** Title, description and an action button — the top of every Galley page. */
function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-9 w-36 rounded-full" />
    </div>
  )
}

function CardsBody() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </>
  )
}

function TableBody({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex gap-4 border-b border-border/70 px-4 py-3">
        {[24, 16, 32, 12].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border/50 px-4 py-3.5 last:border-b-0">
          <Skeleton className="h-4 w-[24%]" />
          <Skeleton className="h-5 w-[16%] rounded-full" />
          <Skeleton className="h-4 w-[32%]" />
          <Skeleton className="h-4 w-[12%]" />
        </div>
      ))}
    </div>
  )
}

function DetailBody() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="grid content-start gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * Placeholder layout while a Galley page loads. Pick the variant closest to the page's real shape
 * so nothing jumps when data arrives: overview grids, lists, or a detail view.
 */
export function PageSkeleton({
  variant = "cards",
  width = "default",
  className,
}: {
  variant?: PageSkeletonVariant
  /** Match the real page's <Page width> so nothing shifts when it loads. */
  width?: PageWidth
  className?: string
}) {
  return (
    <div role="status" aria-label="Loading page" className={cn(pageContainerClass, pageWidths[width], className)}>
      <HeaderSkeleton />
      {variant === "cards" && <CardsBody />}
      {variant === "table" && <TableBody />}
      {variant === "detail" && <DetailBody />}
    </div>
  )
}
