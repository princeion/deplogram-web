"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { notify } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"

/** Copies `value`; says so. */
export function CopyButton({ value, label = "Copy", disabled }: { value: string; label?: string; disabled?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={disabled || !value}
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1400)
          },
          () => notify.error(new Error("Your browser blocked copying."), { title: "Couldn't copy" })
        )
      }
    >
      <Icon name={copied ? "check" : "copy"} className={cn(copied && "text-success")} />
      {copied ? "Copied" : label}
    </Button>
  )
}
