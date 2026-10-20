/** The editor language for a file path, by extension — Monaco's ids. */
export function languageOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    css: "css",
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    py: "python",
    php: "php",
    go: "go",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
    sql: "sql",
    xml: "xml",
    csv: "plaintext",
    txt: "plaintext",
  }
  return map[ext] ?? "plaintext"
}
