"use client"

import * as React from "react"

import { formatBytes } from "@/lib/format"
import { base64ToText, bytesToBase64, textToBase64 } from "@/features/utilities/lib/codecs"
import { notify } from "@/components/feedback"
import { Segmented } from "@/components/shared/segmented"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { byteLength, CodeArea, CopyButton, Fact, Pane, StatusLine } from "@/features/utilities/components/utility-shell"

const SAMPLES = { encode: "Deplogram — deploy across eight runtimes. ✓", decode: "RGVwbG9ncmFtIOKAlCBkZXBsb3kgYWNyb3NzIGVpZ2h0IHJ1bnRpbWVzLiDinJM=" }

/** Text ⇄ Base64 (standard or URL-safe), and files to Base64 or a data URL. */
export function Base64Tool() {
  const [mode, setMode] = React.useState<"encode" | "decode">("encode")
  const [input, setInput] = React.useState(SAMPLES.encode)
  const [urlSafe, setUrlSafe] = React.useState(false)
  const [file, setFile] = React.useState<{ name: string; type: string; size: number; base64: string } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const result = React.useMemo(() => {
    if (file) return { state: "ok" as const, output: file.base64, binary: false, bytes: null as Uint8Array | null }
    if (!input) return { state: "idle" as const }
    try {
      if (mode === "encode") return { state: "ok" as const, output: textToBase64(input, urlSafe), binary: false, bytes: null }
      const decoded = base64ToText(input)
      return { state: "ok" as const, output: decoded.text, binary: decoded.binary, bytes: decoded.bytes }
    } catch (error) {
      return { state: "error" as const, message: error instanceof Error ? error.message : "Couldn't decode that." }
    }
  }, [input, mode, urlSafe, file])

  const switchMode = (next: "encode" | "decode") => {
    setFile(null)
    // Carry the result over, so encode → decode round-trips what you just made.
    if (result.state === "ok" && !result.binary && result.output) setInput(result.output)
    setMode(next)
  }

  const encodeFile = async (picked: File) => {
    if (picked.size > 10_000_000) return notify.error(new Error("Files up to 10 MB — Base64 makes them a third bigger."), { title: "That file is too big" })
    const bytes = new Uint8Array(await picked.arrayBuffer())
    setFile({ name: picked.name, type: picked.type || "application/octet-stream", size: picked.size, base64: bytesToBase64(bytes, urlSafe) })
    setMode("encode")
  }

  const downloadBinary = () => {
    if (!result.bytes) return
    const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)]))
    const a = document.createElement("a")
    a.href = url
    a.download = "decoded.bin"
    a.click()
    URL.revokeObjectURL(url)
  }

  const output = result.state === "ok" && !result.binary ? result.output : ""
  const dataUrl = file ? `data:${file.type};base64,${file.base64}` : ""

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Direction"
          size="sm"
          value={mode}
          onChange={switchMode}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
        {mode === "encode" && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={urlSafe} onCheckedChange={setUrlSafe} /> URL-safe
          </label>
        )}
        <div className="ml-auto flex gap-1">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Encode a file
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              setInput(SAMPLES[mode])
            }}
          >
            <Icon name="sparkles" /> Sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              setInput("")
            }}
          >
            <Icon name="x" /> Clear
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked) void encodeFile(picked)
            e.target.value = ""
          }}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Pane title={file ? "File" : mode === "encode" ? "Text" : "Base64"} icon={file ? "file" : mode === "encode" ? "file-text" : "binary"} bodyClassName="h-80">
          {file ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <div className="grid justify-items-center gap-2">
                <span className="surface-sunken grid size-12 place-items-center rounded-xl text-muted-foreground">
                  <Icon name="file" size="md" />
                </span>
                <p className="text-sm font-medium break-all">{file.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {file.type} · {formatBytes(file.size)}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Back to text
                </Button>
              </div>
            </div>
          ) : (
            <CodeArea value={input} onChange={setInput} label={mode === "encode" ? "Text to encode" : "Base64 to decode"} placeholder={mode === "encode" ? "Type or paste text" : "Paste Base64"} />
          )}
        </Pane>
        <Pane
          title={mode === "encode" ? "Base64" : "Text"}
          icon={mode === "encode" ? "binary" : "file-text"}
          actions={
            <>
              {file && <CopyButton value={dataUrl} label="Copy data URL" />}
              <CopyButton value={output} />
            </>
          }
          bodyClassName="h-80"
        >
          {result.state === "ok" && result.binary ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <div className="grid justify-items-center gap-2">
                <p className="text-sm">This decodes to binary data, not text.</p>
                <p className="font-mono text-xs text-muted-foreground">{formatBytes(result.bytes?.length ?? 0)}</p>
                <Button variant="outline" size="sm" onClick={downloadBinary}>
                  <Icon name="download" /> Download it
                </Button>
              </div>
            </div>
          ) : (
            <CodeArea value={output} readOnly label="Result" className="break-all" />
          )}
        </Pane>
      </div>

      {result.state === "idle" && <StatusLine tone="idle">Type text to encode, or switch to Decode and paste Base64.</StatusLine>}
      {result.state === "error" && <StatusLine tone="error">{result.message}</StatusLine>}
      {result.state === "ok" && (
        <StatusLine tone="ok">
          {file ? "File encoded" : mode === "encode" ? (urlSafe ? "Encoded (URL-safe)" : "Encoded") : result.binary ? "Decoded — binary" : "Decoded"}
          <Fact label="in">{file ? formatBytes(file.size) : formatBytes(byteLength(input))}</Fact>
          <Fact label="out">{formatBytes(result.binary ? (result.bytes?.length ?? 0) : byteLength(result.output))}</Fact>
        </StatusLine>
      )}
    </div>
  )
}
