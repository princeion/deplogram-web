"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion";
import { siteConfig } from "@/lib/site";
import { mainNav, productMenu } from "@/content/nav";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/shared/container";
import { Icon } from "@/components/shared/icon";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 font-heading",
        scrolled
          ? "border-border/70 bg-background/75 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-6">
        <Logo />

        <NavigationMenu className="hidden md:flex" aria-label="Main">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent px-3 text-muted-foreground hover:bg-transparent hover:text-foreground data-popup-open:bg-transparent data-popup-open:text-foreground">
                Product
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-136 gap-1 p-1 sm:grid-cols-2">
                  {productMenu.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink
                        render={<Link href={item.href} />}
                        className="flex items-start gap-3 rounded-lg p-3"
                      >
                        {item.icon && (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg elevation-control text-brand-ink">
                            <Icon name={item.icon} />
                          </span>
                        )}
                        <span className="grid gap-0.5">
                          <span className="font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    render={<Link href={item.href} />}
                    active={active}
                    aria-current={active ? "page" : undefined}
                    className="relative rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground focus:bg-transparent aria-[current=page]:text-foreground data-[active=true]:bg-transparent"
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 -bottom-px h-px bg-brand-ink"
                        transition={SPRING.snappy}
                      />
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={siteConfig.appUrl}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden text-muted-foreground sm:inline-flex",
            )}
          >
            Sign in
          </Link>
          <Link
            href={siteConfig.appUrl}
            className={cn(
              buttonVariants({ variant: "inverted", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Start for free
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Icon name="menu" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-sm elevation-floating"
              data-lenis-prevent
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav
                aria-label="Mobile"
                className="flex flex-col gap-6 overflow-y-auto px-4 pb-6"
              >
                <div className="grid gap-1">
                  <p className="px-3 pb-1 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
                    Product
                  </p>
                  {productMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      {item.icon && (
                        <Icon name={item.icon} className="text-brand-ink" />
                      )}
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="grid gap-1 border-t border-border/70 pt-4">
                  {mainNav.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-brand-ink aria-[current=page]:underline-offset-4"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-auto grid gap-2">
                  <Link
                    href={siteConfig.appUrl}
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({
                      variant: "inverted",
                      size: "lg",
                    })}
                  >
                    Start for free
                  </Link>
                  <Link
                    href={siteConfig.appUrl}
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                    })}
                  >
                    Sign in
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
