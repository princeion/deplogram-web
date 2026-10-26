"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { CodeArea, CopyButton, Fact, Pane, StatusLine } from "@/features/utilities/components/utility-shell"

const SAMPLE = {
  pattern: "(?<user>[a-z0-9._-]+)@(?<domain>[a-z0-9-]+\\.[a-z.]+)",
  flags: "gi",
  text: `Support: help@deplogram.com
Billing — billing@deplogram.com, or ada.obi@rektina.ng
Not an address: ada@ or @deplogram`,
  replace: "<$<user> at $<domain>>",
}

const FLAGS: { flag: string; label: string; hint: string }[] = [
  { flag: "g", label: "g", hint: "Global — find every match" },
  { flag: "i", label: "i", hint: "Ignore case" },
  { flag: "m", label: "m", hint: "Multiline — ^ and $ match at line breaks" },
  { flag: "s", label: "s", hint: "Dot matches line breaks" },
  { flag: "u", label: "u", hint: "Unicode" },
  { flag: "y", label: "y", hint: "Sticky — match from lastIndex only" },
]

const MAX_MATCHES = 500

type Match = { index: number; value: string; groups: [string, string | undefined][] }

/** A pattern, flags and text: matches highlighted live, each with its groups, and an optional replace. */
export function RegexTester() {
  const [pattern, setPattern] = React.useState(SAMPLE.pattern)
  const [flags, setFlags] = React.useState(SAMPLE.flags)
  const [text, setText] = React.useState(SAMPLE.text)
  const [replace, setReplace] = React.useState(SAMPLE.replace)
  const [replacing, setReplacing] = React.useState(true)

  const result = React.useMemo(() => {
    if (!pattern) return { state: "idle" as const }
    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch (error) {
      return { state: "error" as const, message: error instanceof Error ? error.message.replace(/^Invalid regular expression: /, "") : "Invalid pattern" }
    }
    const matches: Match[] = []
    const global = flags.includes("g") || flags.includes("y")
    const finder = new RegExp(pattern, global ? flags : `${flags}g`)
    let m: RegExpExecArray | null
    while ((m = finder.exec(text)) && matches.length < MAX_MATCHES) {
      const named = m.groups ? Object.entries(m.groups) : []
      const numbered = named.length ? [] : m.slice(1).map((g, i): [string, string | undefined] => [String(i + 1), g])
      matches.push({ index: m.index, value: m[0], groups: [...named, ...numbered] })
      if (m[0] === "") finder.lastIndex++ // don't loop forever on empty matches
      if (!global) break
    }
    let replaced = ""
    try {
      replaced = text.replace(regex, replace)
    } catch {}
    return { state: "ok" as const, matches, replaced, capped: matches.length >= MAX_MATCHES }
  }, [pattern, flags, text, replace])

  const toggle = (flag: string) => setFlags((f) => (f.includes(flag) ? f.replace(flag, "") : f + flag))

  // The test text, cut at the matches so each can be marked.
  const highlighted = React.useMemo(() => {
    if (result.state !== "ok") return [{ text, match: false }]
    const parts: { text: string; match: boolean; n?: number }[] = []
    let at = 0
    result.matches.forEach((m, n) => {
      if (m.index > at) parts.push({ text: text.slice(at, m.index), match: false })
      parts.push({ text: m.value || "∅", match: true, n })
      at = m.index + m.value.length
    })
    parts.push({ text: text.slice(at), match: false })
    return parts
  }, [result, text])

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="surface-sunken flex h-10 min-w-0 flex-1 items-center rounded-lg px-3 font-mono text-sm">
          <span className="text-muted-foreground">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            aria-label="Pattern"
            placeholder="pattern"
            className="min-w-0 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground/50"
          />
          <span className="text-muted-foreground">/{flags}</span>
        </label>
        <div role="group" aria-label="Flags" className="surface-sunken flex gap-0.5 rounded-lg p-1">
          {FLAGS.map((f) => (
            <button
              key={f.flag}
              type="button"
              aria-pressed={flags.includes(f.flag)}
              title={f.hint}
              onClick={() => toggle(f.flag)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                flags.includes(f.flag) ? "surface-raised text-foreground" : "border border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPattern(SAMPLE.pattern)
            setFlags(SAMPLE.flags)
            setText(SAMPLE.text)
            setReplace(SAMPLE.replace)
          }}
        >
          <Icon name="sparkles" /> Sample
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Pane title="Test text" icon="file-text" bodyClassName="h-64">
          <CodeArea value={text} onChange={setText} label="Test text" placeholder="Text to search" />
        </Pane>
        <Pane title="Matches" icon="search" bodyClassName="h-64 overflow-auto">
          <p className="px-3.5 py-3 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap">
            {highlighted.map((part, i) =>
              part.match ? (
                <mark key={i} className={cn("rounded-[3px] px-px text-foreground", part.n! % 2 ? "bg-brand/40" : "bg-brand/25")}>
                  {part.text}
                </mark>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </p>
        </Pane>
      </div>

      {result.state === "idle" && <StatusLine tone="idle">Type a pattern.</StatusLine>}
      {result.state === "error" && <StatusLine tone="error">{result.message}</StatusLine>}
      {result.state === "ok" && (
        <StatusLine tone={result.matches.length ? "ok" : "warn"}>
          {result.matches.length === 0 ? "No matches" : `${result.matches.length}${result.capped ? "+" : ""} ${result.matches.length === 1 ? "match" : "matches"}`}
          {result.matches[0] && <Fact label="groups">{result.matches[0].groups.length}</Fact>}
        </StatusLine>
      )}

      {result.state === "ok" && result.matches.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Pane title="Match details" icon="layers" bodyClassName="max-h-72 overflow-auto">
            <ol className="divide-y divide-border/50">
              {result.matches.slice(0, 100).map((m, n) => (
                <li key={n} className="grid gap-1 px-3.5 py-2.5">
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">#{n + 1}</span>
                    <span className="min-w-0 truncate font-mono text-foreground">{m.value || "(empty)"}</span>
                    <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">at {m.index}</span>
                  </p>
                  {m.groups.length > 0 && (
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 pl-6 font-mono text-xs">
                      {m.groups.map(([name, value]) => (
                        <React.Fragment key={name}>
                          <dt className="text-muted-foreground">{name}</dt>
                          <dd className="truncate">{value ?? <span className="text-muted-foreground">undefined</span>}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          </Pane>
          <Pane
            title="Replace"
            icon="refresh"
            actions={
              <>
                <Button variant="ghost" size="xs" onClick={() => setReplacing((r) => !r)}>
                  {replacing ? "Hide" : "Show"}
                </Button>
                {replacing && <CopyButton value={result.replaced} />}
              </>
            }
          >
            {replacing ? (
              <div className="grid">
                <input
                  value={replace}
                  onChange={(e) => setReplace(e.target.value)}
                  spellCheck={false}
                  aria-label="Replacement"
                  placeholder="Replacement — $1, $<name>, $&"
                  className="surface-sunken mx-3.5 mt-3 h-9 rounded-md px-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
                <p className="px-3.5 py-3 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap">{result.replaced}</p>
              </div>
            ) : (
              <p className="px-3.5 py-3 text-sm text-muted-foreground">Replace every match with a pattern of your own.</p>
            )}
          </Pane>
        </div>
      )}
    </div>
  )
}
