import type * as React from "react"

/**
 * Shows `desktop` from the md breakpoint up and `mobile` below it. Detailed product mocks are
 * desktop-only; phones get a compact view that stays readable.
 */
export function ScreenSwitch({ desktop, mobile }: { desktop: React.ReactNode; mobile: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:block">{desktop}</div>
      <div className="md:hidden">{mobile}</div>
    </>
  )
}
