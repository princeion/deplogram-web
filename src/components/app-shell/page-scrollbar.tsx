"use client"

import * as React from "react"

const MIN_THUMB = 44
const IDLE_AFTER = 1100

/**
 * The page's scrollbar, drawn in the frame's right gutter (outside the content panel). The page
 * scrolls natively — wheel, keys, touch and find-in-page all work as usual; this replaces only the
 * look. Idle it's a faint slim pill; while scrolling it brightens, widens and glows; dragged, it
 * lights up in the brand colour. Click the rail to jump. Hidden on touch-sized screens, where the
 * browser's overlay scrollbars already do this well.
 */
export function PageScrollbar() {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLDivElement>(null)
  const metrics = React.useRef({ max: 0, travel: 0 })

  React.useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return
    const root = document.documentElement
    let frame = 0
    let idleTimer: number | undefined

    const update = () => {
      frame = 0
      const max = root.scrollHeight - window.innerHeight
      const trackHeight = track.clientHeight
      track.dataset.scrollable = String(max > 1)
      if (max <= 1) return
      const thumbHeight = Math.max(MIN_THUMB, (trackHeight * window.innerHeight) / root.scrollHeight)
      const travel = trackHeight - thumbHeight
      metrics.current = { max, travel }
      thumb.style.height = `${thumbHeight}px`
      thumb.style.transform = `translate3d(-50%, ${(window.scrollY / max) * travel}px, 0)`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onScroll = () => {
      schedule()
      track.dataset.active = "true"
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => delete track.dataset.active, IDLE_AFTER)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", schedule)
    // Content height changes (navigation, data loading, accordions) move the thumb too.
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", schedule)
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
    }
  }, [])

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const track = trackRef.current!
    const thumb = event.currentTarget
    thumb.setPointerCapture(event.pointerId)
    track.dataset.dragging = "true"
    const startY = event.clientY
    const startScroll = window.scrollY

    const onMove = (move: PointerEvent) => {
      const { max, travel } = metrics.current
      if (travel <= 0) return
      window.scrollTo({ top: startScroll + ((move.clientY - startY) / travel) * max, behavior: "instant" })
    }
    const onUp = () => {
      delete track.dataset.dragging
      thumb.removeEventListener("pointermove", onMove)
      thumb.removeEventListener("pointerup", onUp)
      thumb.removeEventListener("pointercancel", onUp)
    }
    thumb.addEventListener("pointermove", onMove)
    thumb.addEventListener("pointerup", onUp)
    thumb.addEventListener("pointercancel", onUp)
  }

  // Clicking the rail glides the page so the thumb centres where you clicked.
  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const track = trackRef.current!
    const thumb = thumbRef.current!
    const { max, travel } = metrics.current
    if (travel <= 0) return
    const rect = track.getBoundingClientRect()
    const target = event.clientY - rect.top - thumb.offsetHeight / 2
    window.scrollTo({ top: (Math.min(Math.max(target, 0), travel) / travel) * max, behavior: "smooth" })
  }

  return (
    <div
      ref={trackRef}
      aria-hidden
      onPointerDown={onTrackPointerDown}
      data-scrollable="false"
      className="group/scrollbar fixed top-14 right-0 bottom-0 z-40 hidden w-3.5 py-4 data-[scrollable=false]:pointer-events-none data-[scrollable=false]:opacity-0 md:block"
    >
      <div className="relative h-full">
        {/* The rail: only shows while you're interacting. */}
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-foreground/0 transition-colors duration-500 group-hover/scrollbar:bg-foreground/10 group-data-[active]/scrollbar:bg-foreground/8 group-data-[dragging]/scrollbar:bg-foreground/12" />
        <div
          ref={thumbRef}
          onPointerDown={onThumbPointerDown}
          className={[
            "absolute top-0 left-1/2 w-1 cursor-grab touch-none rounded-full will-change-transform active:cursor-grabbing",
            "bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_70%,transparent),color-mix(in_oklab,var(--foreground)_30%,transparent))]",
            "opacity-35 transition-[width,opacity,box-shadow,background-color] duration-300 ease-out-expo",
            // Scrolling: brighter, wider, a soft glow.
            "group-hover/scrollbar:w-1.5 group-hover/scrollbar:opacity-70",
            "group-data-[active]/scrollbar:w-1.5 group-data-[active]/scrollbar:opacity-90 group-data-[active]/scrollbar:shadow-[0_0_14px_color-mix(in_oklab,var(--foreground)_35%,transparent)]",
            // Dragging: lit in the brand colour.
            "group-data-[dragging]/scrollbar:w-2 group-data-[dragging]/scrollbar:opacity-100 group-data-[dragging]/scrollbar:bg-[linear-gradient(to_bottom,var(--brand),color-mix(in_oklab,var(--brand)_45%,transparent))] group-data-[dragging]/scrollbar:shadow-[0_0_18px_color-mix(in_oklab,var(--brand)_60%,transparent)]",
          ].join(" ")}
        />
      </div>
    </div>
  )
}
