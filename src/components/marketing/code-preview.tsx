import * as React from "react"

import { cn } from "@/lib/utils"
import { TerminalWindow } from "@/components/shared/terminal-window"

type CodePreviewProps = {
  title: string
  code: string
  className?: string
  action?: React.ReactNode
}

const KEYWORDS = new Set(["import", "from", "await", "const", "export", "async", "return", "function", "git", "bun", "dpl"])

/** Minimal token colouring: strings in brand ink, keywords muted. Enough for marketing snippets. */
function highlightLine(line: string): React.ReactNode[] {
  const tokens = line.split(/("[^"]*"|`[^`]*`|\s+|[{}(),:.])/g).filter(Boolean)
  return tokens.map((token, i) => {
    if (/^["`]/.test(token)) return <span key={i} className="text-brand-ink">{token}</span>
    if (KEYWORDS.has(token)) return <span key={i} className="text-muted-foreground">{token}</span>
    if (token.startsWith("→") || token.startsWith("✓")) return <span key={i} className="text-muted-foreground">{token}</span>
    return <React.Fragment key={i}>{token}</React.Fragment>
  })
}

/** Static code/terminal block in the shared window chrome. */
export function CodePreview({ title, code, className, action }: CodePreviewProps) {
  return (
    <TerminalWindow title={title} action={action} className={className}>
      <pre className="overflow-x-auto" data-lenis-prevent>
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i} className={cn("block min-h-[1.5em]", line.startsWith("✓") && "text-brand-ink")}>
              {highlightLine(line)}
            </span>
          ))}
        </code>
      </pre>
    </TerminalWindow>
  )
}
