import { PageSkeleton } from "@/components/app-shell/page-skeleton"

/**
 * Default loading state for every Galley page. Pages with a different shape add their own
 * loading.tsx with a matching variant (e.g. <PageSkeleton variant="table" /> for lists).
 */
export default function Loading() {
  return <PageSkeleton />
}
