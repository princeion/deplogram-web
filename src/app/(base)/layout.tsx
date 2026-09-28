import { MarketingShell } from "@/components/marketing/marketing-shell"

/** Public marketing site: shared navbar + footer for every page in this group. */
export default function BaseLayout({ children }: LayoutProps<"/">) {
  return <MarketingShell>{children}</MarketingShell>
}
