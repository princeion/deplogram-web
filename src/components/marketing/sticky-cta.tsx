"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { useLenis } from "lenis/react"

import { cn } from "@/lib/utils"
import { entrance } from "@/lib/motion"
import { siteConfig } from "@/lib/site"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

const SHOW_AFTER_PX = 720

/** Bottom-right waitlist CTA + back to top, once the hero is out of view. */
export function StickyCta() {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const lenis = useLenis()
  const [visible, setVisible] = React.useState(false)

  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > SHOW_AFTER_PX))

  if (pathname === siteConfig.waitlistUrl) return null

  function toTop() {
    if (lenis) lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={entrance}
          className="fixed right-3 bottom-3 z-40 flex items-center gap-2 sm:right-5 sm:bottom-5"
        >
          <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }))}>
            Join the waitlist
            <Icon name="arrow-right" />
          </Link>
          <button
            type="button"
            onClick={toTop}
            aria-label="Back to top"
            className={cn(buttonVariants({ variant: "outline", size: "icon-lg" }))}
          >
            <Icon name="arrow-up" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
