import Link from "next/link"
import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { galleyNav } from "@/content/workspace"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"
import { Logo } from "@/components/shared/logo"
import { GalleyEmptyState } from "@/components/marketing/galley-mock"

export const metadata: Metadata = {
  title: "Your Galley",
}

// TODO: placeholder only. Lives at /dashboard because (app)/page.tsx would collide with the homepage at "/".
// Shows the empty Galley until the product opens.
export default function DashboardPage() {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border/70 px-5">
          <Logo />
        </div>
        <p className="px-5 pt-6 pb-3 font-heading text-lg font-semibold tracking-tight">Your Galley</p>
        <nav aria-label="Galley" className="flex flex-col">
          {galleyNav.map((item, i) => (
            <span
              key={item.label}
              aria-disabled
              className={cn(
                "flex items-center gap-3 border-l-2 px-5 py-2.5 text-sm",
                i === 0 ? "border-brand bg-background font-medium" : "border-transparent text-muted-foreground"
              )}
            >
              <Icon name={item.icon} size="xs" />
              {item.label}
            </span>
          ))}
        </nav>
      </aside>
      <main className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-5 sm:px-8">
          <span className="md:hidden">
            <Logo />
          </span>
          <p className="hidden font-heading text-lg font-semibold tracking-tight md:block">Projects</p>
          <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-[0.625rem] tracking-eyebrow text-brand-foreground uppercase">Early access</span>
        </div>
        <div className="flex flex-1 items-center justify-center p-5 sm:p-8">
          <GalleyEmptyState className="w-full max-w-xl">
            <p className="text-sm text-muted-foreground">Deplogram isn&apos;t open yet — your Galley will be ready when your invite is.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ variant: "inverted" }))}>
                Deploy your first project
                <Icon name="arrow-right" />
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                Back to home
              </Link>
            </div>
          </GalleyEmptyState>
        </div>
      </main>
    </div>
  )
}
