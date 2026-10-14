import { MarketingShell } from "@/components/marketing/marketing-shell"
import { SmoothScroll } from "@/components/shared/motion/smooth-scroll"

/**
 * Public marketing site: shared navbar + footer for every page in this group, with Lenis smooth
 * scrolling. Only here — the app (Your Galley) scrolls natively, so panels like build logs, menus
 * and tables scroll on their own.
 */
export default function BaseLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScroll>
      <MarketingShell>{children}</MarketingShell>
    </SmoothScroll>
  )
}
