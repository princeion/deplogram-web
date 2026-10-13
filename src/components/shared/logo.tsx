import Link from "next/link"

import { cn } from "@/lib/utils"
import { NodeGraph } from "@/components/shared/node-graph"

type LogoProps = {
  className?: string
  /** Render the wordmark next to the mark. */
  wordmark?: boolean
  /** Wordmark height — the signature is tall (the "D"), so it needs room to stay legible. */
  size?: "default" | "lg"
}

/** The brand lockup: the NodeGraph mark + the hand-signed "Deplogram" wordmark. */
export function Logo({ className, wordmark = true, size = "default" }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Deplogram home"
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <NodeGraph layout="mark" size="mark" state="live" className="size-6" />
      {wordmark && <SignatureWordmark className={size === "lg" ? "h-16" : "-my-3 h-12"} />}
    </Link>
  )
}

/**
 * The signature, traced from public/brand/deplogram-signature.png into an alpha mask
 * (public/brand/deplogram-wordmark.png) and painted with currentColor, so it follows the theme.
 */
export function SignatureWordmark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block aspect-652/233 shrink-0 bg-current", className)}
      style={{
        maskImage: "url(/brand/deplogram-wordmark.png)",
        WebkitMaskImage: "url(/brand/deplogram-wordmark.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  )
}
