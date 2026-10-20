"use client"

import * as React from "react"
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react"
import type { editor } from "monaco-editor"

import { cn } from "@/lib/utils"
import { languageOf } from "@/features/codepad/codepad"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Monaco, dressed as Deplogram: the editor's colours come from the theme tokens (resolved at
 * runtime, so light and dark both match the app), Geist Mono, no minimap. Each file is its own
 * Monaco model (`path`), so undo history and cursor survive switching tabs. Monaco itself is
 * fetched from the CDN by @monaco-editor/react on first use, so it never weighs on other pages.
 */

/** Any CSS colour (oklch, color-mix…) → "#rrggbb", via a 1px canvas — Monaco only takes hex. */
function toHex(css: string, fallback: string) {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || !css) return fallback
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`
  } catch {
    return fallback
  }
}

function readTheme() {
  const style = getComputedStyle(document.documentElement)
  const v = (name: string) => style.getPropertyValue(name).trim()
  const dark = document.documentElement.classList.contains("dark")
  return {
    dark,
    background: toHex(v("--card"), dark ? "#121212" : "#f8f8f8"),
    foreground: toHex(v("--foreground"), dark ? "#fafafa" : "#111111"),
    muted: toHex(v("--muted-foreground"), "#888888"),
    line: toHex(v("--muted"), dark ? "#262626" : "#eeeeee"),
    brand: toHex(v("--brand"), "#ff5c35"),
    font: v("--font-geist-mono") || "ui-monospace, monospace",
  }
}

function defineTheme(monaco: Parameters<BeforeMount>[0]) {
  const t = readTheme()
  monaco.editor.defineTheme("deplogram", {
    base: t.dark ? "vs-dark" : "vs",
    inherit: true,
    rules: [{ token: "comment", foreground: t.muted.slice(1), fontStyle: "italic" }],
    colors: {
      "editor.background": t.background,
      "editor.foreground": t.foreground,
      "editorLineNumber.foreground": `${t.muted}99`,
      "editorLineNumber.activeForeground": t.foreground,
      "editor.lineHighlightBackground": `${t.line}80`,
      "editor.lineHighlightBorder": "#00000000",
      "editorCursor.foreground": t.brand,
      "editor.selectionBackground": `${t.brand}40`,
      "editor.inactiveSelectionBackground": `${t.brand}22`,
      "editorIndentGuide.background1": `${t.muted}26`,
      "editorIndentGuide.activeBackground1": `${t.muted}66`,
      "editorWidget.background": t.background,
      "editorGutter.background": t.background,
      "scrollbarSlider.background": `${t.muted}33`,
      "scrollbarSlider.hoverBackground": `${t.muted}55`,
      "scrollbarSlider.activeBackground": `${t.muted}77`,
    },
  })
  return t
}

export type CodeEditorHandle = editor.IStandaloneCodeEditor

export function CodeEditor({
  modelPath,
  filePath,
  value,
  onChange,
  onMount,
  readOnly = false,
  className,
}: {
  /** Unique per pad + file, e.g. "pad_1/index.html" — one Monaco model each. */
  modelPath: string
  /** The file's path in the pad, for the language. */
  filePath: string
  /** Initial content of the model (later edits live in the model). */
  value: string
  onChange: (value: string) => void
  onMount?: (editor: CodeEditorHandle, monaco: Parameters<OnMount>[1]) => void
  readOnly?: boolean
  className?: string
}) {
  const monacoRef = React.useRef<Parameters<BeforeMount>[0] | null>(null)
  const [font, setFont] = React.useState("ui-monospace, monospace")

  // Re-theme when the app's theme flips (next-themes toggles the class on <html>).
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!monacoRef.current) return
      defineTheme(monacoRef.current)
      monacoRef.current.editor.setTheme("deplogram")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn("relative h-full min-h-0", className)}>
      <Editor
        path={`file:///${modelPath}`}
        defaultValue={value}
        defaultLanguage={languageOf(filePath)}
        language={languageOf(filePath)}
        theme="deplogram"
        loading={<EditorSkeleton />}
        beforeMount={(monaco) => {
          monacoRef.current = monaco
          setFont(defineTheme(monaco).font)
        }}
        onMount={onMount}
        onChange={(next) => onChange(next ?? "")}
        options={{
          readOnly,
          fontFamily: font,
          fontSize: 13,
          lineHeight: 21,
          fontLigatures: true,
          minimap: { enabled: false },
          padding: { top: 14, bottom: 14 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "line",
          tabSize: 2,
          wordWrap: "on",
          automaticLayout: true,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          guides: { indentation: true },
          stickyScroll: { enabled: false },
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
        }}
      />
    </div>
  )
}

/** The code-shaped placeholder while Monaco loads. */
function EditorSkeleton() {
  const widths = ["w-1/3", "w-2/3", "w-1/2", "w-3/5", "w-1/4", "w-2/3", "w-2/5", "w-1/2"]
  return (
    <div aria-hidden className="grid size-full content-start gap-3 bg-card p-4">
      {widths.map((w, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="w-5 text-right font-mono text-xs text-muted-foreground/40">{i + 1}</span>
          <Skeleton className={cn("h-3", w)} />
        </div>
      ))}
    </div>
  )
}
