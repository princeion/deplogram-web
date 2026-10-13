"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"

import { ProgressiveBlur } from "@/components/shared/progressive-blur"

/** Height of the blurred strip, in vh — also drives the hero observer's root. */
const BLUR_HEIGHT_VH = 14
/** Scroll distance (px) before the blur appears, so no page opens with a softened bottom edge. */
const SCROLL_THRESHOLD = 24

/**
 * A progressive blur pinned to the bottom of the viewport: whatever scrolls underneath softens
 * into the page as it nears the edge. Never blocks clicks. It stays hidden:
 *  - until the visitor starts scrolling;
 *  - while a `[data-hero]` section still sits under the strip, so the hero is never softened;
 *  - once the footer comes into view, so footer links stay sharp.
 */
export function GlobalBottomBlur() {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [scrolled, setScrolled] = React.useState(false)
  const [nearFooter, setNearFooter] = React.useState(false)
  // Starts true so a page opening on a hero never flashes the blur before the observer reports.
  const [overHero, setOverHero] = React.useState(true)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  React.useEffect(() => {
    setNearFooter(false)
    setOverHero(true)
    const observers: IntersectionObserver[] = []

    // The new page's footer and hero mount after the pathname changes — wait a frame for them.
    const raf = requestAnimationFrame(() => {
      const footer = document.querySelector("footer")
      if (footer) {
        // Shrink the root's bottom edge so the blur fades out a little before the footer arrives.
        const footerObserver = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting), {
          rootMargin: "0px 0px -80px 0px",
        })
        footerObserver.observe(footer)
        observers.push(footerObserver)
      }

      const hero = document.querySelector("[data-hero]")
      if (!hero) {
        setOverHero(false)
        return
      }
      // Collapse the root to just the bottom strip, so this is true only while the hero is under it.
      const heroObserver = new IntersectionObserver(([entry]) => setOverHero(entry.isIntersecting), {
        rootMargin: `-${100 - BLUR_HEIGHT_VH}% 0px 0px 0px`,
      })
      heroObserver.observe(hero)
      observers.push(heroObserver)
    })

    return () => {
      cancelAnimationFrame(raf)
      observers.forEach((observer) => observer.disconnect())
    }
  }, [pathname])

  const visible = scrolled && !nearFooter && !overHero

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 print:hidden"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
    >
      <ProgressiveBlur height={`clamp(72px, ${BLUR_HEIGHT_VH}vh, 160px)`} steps={5} maxBlur={16} />
    </motion.div>
  )
}
