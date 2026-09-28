"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { useTheme } from "next-themes"

import { DURATION, EASE_OUT } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

const subscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  // The theme is unknown during SSR; render the dark (default) state until hydrated.
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const isDark = !mounted || resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          className="inline-flex"
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: DURATION.fast, ease: EASE_OUT }}
        >
          <Icon name={isDark ? "moon" : "sun"} />
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
