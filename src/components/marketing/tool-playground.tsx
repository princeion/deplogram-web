"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductWindow } from "@/components/marketing/product-window"

type ToolId = "json" | "base64" | "jwt"

const tools: readonly { id: ToolId; label: string; sample: string }[] = [
  { id: "json", label: "JSON formatter", sample: '{"project":"orders-api","runtime":"node","state":"RUNNING","port":8080}' },
  { id: "base64", label: "Base64", sample: "Deploy across eight runtimes." },
  {
    id: "jwt",
    label: "JWT decoder",
    sample:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZGEiLCJwcm9qZWN0IjoibWVudS1hcGkiLCJleHAiOjE5MjQ5OTIwMDB9.c2lnbmF0dXJl",
  },
]

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function fromBase64(value: string) {
  const normalised = value.trim().replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4)
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

function run(tool: ToolId, reverse: boolean, input: string): { output: string; error?: string } {
  if (!input.trim()) return { output: "" }
  try {
    if (tool === "json") {
      const parsed: unknown = JSON.parse(input)
      return { output: reverse ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2) }
    }
    if (tool === "base64") return { output: reverse ? fromBase64(input) : toBase64(input) }
    const [header, payload] = input.trim().split(".")
    if (!header || !payload) throw new Error("A JWT has three dot-separated parts.")
    const pretty = (part: string) => JSON.stringify(JSON.parse(fromBase64(part)), null, 2)
    return { output: `// header\n${pretty(header)}\n\n// payload\n${pretty(payload)}` }
  } catch (error) {
    return { output: "", error: error instanceof Error ? error.message : "Invalid input" }
  }
}

const modes: Record<ToolId, readonly [string, string] | null> = {
  json: ["Format", "Minify"],
  base64: ["Encode", "Decode"],
  jwt: null,
}

/** A real, working slice of the utilities — runs entirely in the browser. */
export function ToolPlayground() {
  const [tool, setTool] = React.useState<ToolId>("json")
  const [reverse, setReverse] = React.useState(false)
  const [inputs, setInputs] = React.useState<Record<ToolId, string>>(
    () => Object.fromEntries(tools.map((t) => [t.id, t.sample])) as Record<ToolId, string>
  )
  const id = React.useId()
  const result = run(tool, reverse, inputs[tool])
  const current = tools.find((t) => t.id === tool)!
  const modeLabels = modes[tool]

  return (
    <ProductWindow
      title={`utilities / ${current.label.toLowerCase()}`}
      actions={<span className="font-mono text-[0.625rem] text-muted-foreground">runs in your browser</span>}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-3">
        <div role="group" aria-label="Utility" className="flex flex-wrap gap-1 rounded-full elevation-control p-1">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tool === t.id}
              onClick={() => {
                setTool(t.id)
                setReverse(false)
              }}
              className={cn(
                "h-8 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors",
                tool === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {modeLabels && (
          <div role="group" aria-label="Mode" className="flex gap-1 rounded-full elevation-control p-1">
            {modeLabels.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={reverse === (i === 1)}
                onClick={() => setReverse(i === 1)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-sm transition-colors",
                  reverse === (i === 1) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-2">
        <div className="grid gap-2 border-b border-border/70 p-4 md:border-r md:border-b-0">
          <Label htmlFor={`${id}-input`} className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
            Input
          </Label>
          <Textarea
            id={`${id}-input`}
            value={inputs[tool]}
            onChange={(e) => setInputs((prev) => ({ ...prev, [tool]: e.target.value }))}
            spellCheck={false}
            className="min-h-48 resize-none bg-background font-mono text-xs"
            data-lenis-prevent
          />
        </div>
        <div className="grid content-start gap-2 bg-background/60 p-4">
          <span id={`${id}-output`} className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
            Output
          </span>
          <output
            aria-labelledby={`${id}-output`}
            aria-live="polite"
            className="block max-h-56 min-h-48 overflow-auto font-mono text-xs break-all whitespace-pre-wrap"
            data-lenis-prevent
          >
            {result.error ? <span className="text-destructive">{result.error}</span> : result.output}
          </output>
        </div>
      </div>
    </ProductWindow>
  )
}
