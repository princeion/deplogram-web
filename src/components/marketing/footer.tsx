import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { footerNav } from "@/content/nav";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { NodeDot } from "@/components/shared/node-graph";
import { NodeTexture } from "@/components/shared/node-texture";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="font-heading relative mt-auto overflow-hidden border-t border-border/70">
      <NodeTexture className="-top-10 -right-24 w-144" />
      <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Logo />
          <p className="max-w-xs text-sm text-pretty text-muted-foreground">
            {siteConfig.positioning} {siteConfig.tagline}
          </p>
          <Link
            href="/roadmap"
            className="inline-flex w-fit items-center gap-2 rounded-full elevation-control px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <NodeDot lit />
            In development — early access soon
          </Link>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {footerNav.map((group) => (
            <div key={group.title} className="flex flex-col gap-3 font-medium">
              <h2 className=" text-xs text-muted-foreground tracking-tight">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>

      <Container className="relative flex flex-col gap-3 border-t border-border/70 py-6 text-xs text-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {siteConfig.operator}. {siteConfig.name} is a{" "}
          {siteConfig.operator} product.
        </p>
        <p>Built for African developers — and everyone else.</p>
      </Container>

      {/* One-off: the oversized wordmark scales with the viewport, so it uses a vw size, not the type scale. */}
      <div
        aria-hidden
        className="pointer-events-none relative -mb-[4vw] select-none"
      >
        <p className="bg-linear-to-b from-foreground/10 to-transparent bg-clip-text text-center font-heading text-[19vw] leading-none font-medium tracking-tighter text-transparent">
          deplogram
        </p>
      </div>
    </footer>
  );
}
