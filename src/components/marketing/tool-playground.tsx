"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { DURATION, EASE_OUT } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TerminalWindow } from "@/components/shared/terminal-window"

type ToolId = "json" | "base64" | "url"
type Mode = "encode" | "decode"

const toolTabs: readonly { id: ToolId; label: string; sample: string }[] = [
  { id: "json", label: "JSON formatter", sample: '{"project":"myapp","domain":"myapp.dpl.app","runtimes":["node","go"]}' },
  { id: "base64", label: "Base64", sample: "Build. Deploy. Store. Connect." },
  { id: "url", label: "URL encoder", sample: "https://myapp.dpl.app/search?q=naira & kobo" },
]

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value.trim())
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

function run(tool: ToolId, mode: Mode, input: string): { output: string; error?: string } {
  if (!input.trim()) return { output: "" }
  try {
    if (tool === "json") {
      const parsed: unknown = JSON.parse(input)
      return { output: mode === "encode" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed) }
    }
    if (tool === "base64") return { output: mode === "encode" ? toBase64(input) : fromBase64(input) }
    return { output: mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input) }
  } catch (error) {
    return { output: "", error: error instanceof Error ? error.message : "Invalid input" }
  }
}

/** A real, working slice of the toolbelt — runs entirely in the browser. */
export function ToolPlayground() {
  const reduceMotion = useReducedMotion()
  const [tool, setTool] = React.useState<ToolId>("json")
  const [mode, setMode] = React.useState<Mode>("encode")
  const [inputs, setInputs] = React.useState<Record<ToolId, string>>(() =>
    Object.fromEntries(toolTabs.map((t) => [t.id, t.sample])) as Record<ToolId, string>
  )
  const result = run(tool, mode, inputs[tool])
  const modeLabels = tool === "json" ? (["Format", "Minify"] as const) : (["Encode", "Decode"] as const)

  return (
    <Tabs
      value={tool}
      onValueChange={(value) => {
        setTool(value as ToolId)
        setMode("encode")
      }}
      className="gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="h-10 rounded-full elevation-control p-1">
          {toolTabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-full px-3.5">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex gap-1 rounded-full elevation-control p-1" role="group" aria-label="Mode">
          {(["encode", "decode"] as const).map((m, i) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "secondary" : "ghost"}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="h-8"
            >
              {modeLabels[i]}
            </Button>
          ))}
        </div>
      </div>

      {toolTabs.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          <motion.div
            className="grid gap-3 md:grid-cols-2"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
          >
            <div className="grid gap-2">
              <Label htmlFor={`tool-${t.id}-input`}>Input</Label>
              <Textarea
                id={`tool-${t.id}-input`}
                value={inputs[t.id]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                spellCheck={false}
                className="min-h-40 resize-none font-mono text-xs"
                data-lenis-prevent
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium" id={`tool-${t.id}-output`}>
                Output
              </span>
              <TerminalWindow title={`${t.label.toLowerCase()} · ${mode}`} className="rounded-xl">
                <output
                  aria-labelledby={`tool-${t.id}-output`}
                  aria-live="polite"
                  className="block max-h-40 min-h-24 overflow-auto text-xs break-all whitespace-pre-wrap"
                  data-lenis-prevent
                >
                  {result.error ? <span className="text-destructive">{result.error}</span> : result.output}
                </output>
              </TerminalWindow>
            </div>
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
