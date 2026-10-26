"use client"

import * as React from "react"

import { formatBytes } from "@/lib/format"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { Segmented } from "@/components/shared/segmented"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { byteLength, CopyButton, Fact, Pane, StatusLine } from "@/features/utilities/components/utility-shell"

const SAMPLE = `{"project":"orders-api","runtime":"node","state":"RUNNING","port":8080,"env":{"NODE_ENV":"production","LOG_LEVEL":"info"},"regions":["lagos","london"],"replicas":2,"healthy":true}`

type Indent = "2" | "4" | "tab"

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as object).sort().map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]))
  }
  return value
}

function stats(value: unknown) {
  let keys = 0
  let depth = 0
  const walk = (v: unknown, d: number) => {
    depth = Math.max(depth, d)
    if (Array.isArray(v)) v.forEach((x) => walk(x, d + 1))
    else if (v && typeof v === "object") {
      for (const [, x] of Object.entries(v)) {
        keys++
        walk(x, d + 1)
      }
    }
  }
  walk(value, 0)
  return { keys, depth }
}

/** "Unexpected token } in JSON at position 41" → line and column, from the position. */
function locate(message: string, text: string) {
  const position = Number(message.match(/position (\d+)/)?.[1])
  if (!Number.isFinite(position)) return message
  const before = text.slice(0, position)
  const line = before.split("\n").length
  const column = position - before.lastIndexOf("\n")
  return `${message.replace(/ in JSON at position \d+.*$/, "").replace(/\s*\(line \d+ column \d+\)/, "")} — line ${line}, column ${column}`
}

/** JSON in, formatted (or minified) JSON out, with what's wrong when it isn't JSON. */
export function JsonFormatter() {
  const [input, setInput] = React.useState(SAMPLE)
  const [mode, setMode] = React.useState<"format" | "minify">("format")
  const [indent, setIndent] = React.useState<Indent>("2")
  const [sorted, setSorted] = React.useState(false)

  const result = React.useMemo(() => {
    if (!input.trim()) return { state: "idle" as const }
    try {
      const parsed: unknown = JSON.parse(input)
      const value = sorted ? sortKeys(parsed) : parsed
      const output = mode === "minify" ? JSON.stringify(value) : JSON.stringify(value, null, indent === "tab" ? "\t" : Number(indent))
      return { state: "ok" as const, output, ...stats(parsed) }
    } catch (error) {
      return { state: "error" as const, message: locate(error instanceof Error ? error.message : "Not valid JSON", input) }
    }
  }, [input, mode, indent, sorted])

  const output = result.state === "ok" ? result.output : ""

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Output"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "format", label: "Format" },
            { value: "minify", label: "Minify" },
          ]}
        />
        {mode === "format" && (
          <Segmented
            label="Indent"
            size="sm"
            value={indent}
            onChange={setIndent}
            options={[
              { value: "2", label: "2 spaces" },
              { value: "4", label: "4 spaces" },
              { value: "tab", label: "Tabs" },
            ]}
          />
        )}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={sorted} onCheckedChange={setSorted} /> Sort keys
        </label>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
            <Icon name="sparkles" /> Sample
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput("")}>
            <Icon name="x" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Pane title="JSON in" icon="braces" actions={<CopyButton value={input} />} bodyClassName="h-[28rem]">
          <CodeEditor modelPath="utilities/json-in.json" filePath="input.json" value={input} onChange={setInput} minimal />
        </Pane>
        <Pane title={mode === "minify" ? "Minified" : "Formatted"} icon="braces" actions={<CopyButton value={output} />} bodyClassName="h-[28rem]">
          <CodeEditor modelPath="utilities/json-out.json" filePath="output.json" value={output} onChange={() => {}} readOnly minimal />
        </Pane>
      </div>

      {result.state === "idle" && <StatusLine tone="idle">Paste or type JSON on the left.</StatusLine>}
      {result.state === "error" && <StatusLine tone="error">{result.message}</StatusLine>}
      {result.state === "ok" && (
        <StatusLine tone="ok">
          Valid JSON
          <Fact label="keys">{result.keys}</Fact>
          <Fact label="depth">{result.depth}</Fact>
          <Fact label="size">
            {formatBytes(byteLength(input))} → {formatBytes(byteLength(output))}
          </Fact>
        </StatusLine>
      )}
    </div>
  )
}
