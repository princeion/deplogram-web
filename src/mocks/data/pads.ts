import type { Pad, PadFile, PadSummary, PadTemplate, RunLogs } from "@/features/codepad/codepad"

/**
 * In-memory CodePad pads and runs for the mock API. Runs are scripted: each line has a delay, and
 * a log request returns the lines whose time has come, so output streams like the real thing.
 */

const now = () => new Date().toISOString()
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const file = (path: string, content: string, updatedAt = now()): PadFile => ({ path, content, updatedAt })

const templateFiles: Record<PadTemplate, { entry: string; files: () => PadFile[] }> = {
  static: {
    entry: "index.html",
    files: () => [
      file(
        "index.html",
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My page</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main>
      <h1>Hello from CodePad</h1>
      <p>Edit <code>index.html</code>, <code>style.css</code> or <code>script.js</code> and the preview updates.</p>
      <button id="count">Clicked 0 times</button>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`
      ),
      file(
        "style.css",
        `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #0b0b0b;
  color: #f5f5f5;
}

main {
  text-align: center;
}

button {
  padding: 0.6rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: #ff5c35;
  color: #111;
  font-weight: 600;
  cursor: pointer;
}
`
      ),
      file(
        "script.js",
        `const button = document.getElementById("count")
let clicks = 0

button.addEventListener("click", () => {
  clicks += 1
  button.textContent = \`Clicked \${clicks} time\${clicks === 1 ? "" : "s"}\`
})
`
      ),
    ],
  },
  node: {
    entry: "index.js",
    files: () => [
      file(
        "index.js",
        `import { createServer } from "node:http"

const port = process.env.PORT ?? 3000

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ ok: true, path: req.url, at: new Date().toISOString() }))
})

server.listen(port, () => {
  console.log(\`Listening on http://localhost:\${port}\`)
})
`
      ),
      file(
        "package.json",
        `{
  "name": "hello-api",
  "type": "module",
  "scripts": { "start": "node index.js" }
}
`
      ),
    ],
  },
  python: {
    entry: "main.py",
    files: () => [
      file(
        "main.py",
        `from datetime import date


def greet(name: str) -> str:
    return f"Hello, {name}! Today is {date.today():%A}."


if __name__ == "__main__":
    for name in ["Ada", "Chinedu", "Funke"]:
        print(greet(name))
`
      ),
      file("requirements.txt", "# One package per line, e.g.\n# requests==2.32.3\n"),
    ],
  },
}

const runtimeOf: Record<PadTemplate, string> = { static: "static", node: "node", python: "python" }

let nextPad = 3
const pads = new Map<string, Pad>([
  ["pad_1", { id: "pad_1", name: "landing-page", runtime: "static", entry: "index.html", projectId: null, updatedAt: ago(42), files: templateFiles.static.files().map((f) => ({ ...f, updatedAt: ago(42) })) }],
  ["pad_2", { id: "pad_2", name: "hello-api", runtime: "node", entry: "index.js", projectId: null, updatedAt: ago(60 * 26), files: templateFiles.node.files().map((f) => ({ ...f, updatedAt: ago(60 * 26) })) }],
])

const summary = (pad: Pad): PadSummary => ({
  id: pad.id,
  name: pad.name,
  runtime: pad.runtime,
  fileCount: pad.files.length,
  updatedAt: pad.updatedAt,
  projectId: pad.projectId,
})

export const mockPads = {
  list: () => [...pads.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(summary),
  get: (id: string) => pads.get(id) ?? null,
  create(name: string, template: PadTemplate): Pad {
    const t = templateFiles[template]
    const pad: Pad = { id: `pad_${nextPad++}`, name, runtime: runtimeOf[template], entry: t.entry, projectId: null, updatedAt: now(), files: t.files() }
    pads.set(pad.id, pad)
    return pad
  },
  rename(id: string, name: string) {
    const pad = pads.get(id)
    if (!pad) return null
    pad.name = name
    pad.updatedAt = now()
    return pad
  },
  remove: (id: string) => pads.delete(id),
  saveFile(id: string, path: string, content: string) {
    const pad = pads.get(id)
    if (!pad) return null
    const saved = file(path, content)
    const at = pad.files.findIndex((f) => f.path === path)
    if (at >= 0) pad.files[at] = saved
    else pad.files.push(saved)
    pad.files.sort((a, b) => a.path.localeCompare(b.path))
    pad.updatedAt = saved.updatedAt
    return saved
  },
  renameFile(id: string, from: string, to: string) {
    const pad = pads.get(id)
    const f = pad?.files.find((x) => x.path === from)
    if (!pad || !f) return null
    if (pad.files.some((x) => x.path === to)) return "exists" as const
    f.path = to
    if (pad.entry === from) pad.entry = to
    pad.files.sort((a, b) => a.path.localeCompare(b.path))
    pad.updatedAt = now()
    return pad
  },
  /** After the first deploy: the project this pad became. */
  linkProject(id: string, projectId: string) {
    const pad = pads.get(id)
    if (pad) pad.projectId = projectId
  },
  deleteFile(id: string, path: string) {
    const pad = pads.get(id)
    if (!pad) return null
    pad.files = pad.files.filter((f) => f.path !== path)
    if (pad.entry === path) pad.entry = pad.files[0]?.path ?? ""
    pad.updatedAt = now()
    return pad
  },
}

// ── Runs ───────────────────────────────────────────────────────────────────────

type ScriptLine = { text: string; stream?: "stdout" | "stderr"; delay: number }
const runs = new Map<string, { startedAt: number; script: ScriptLine[]; exitCode: number }>()
let nextRun = 1

function scriptFor(pad: Pad): { script: ScriptLine[]; exitCode: number } {
  const entry = pad.files.find((f) => f.path === pad.entry)
  if (pad.runtime === "static") {
    return {
      exitCode: 0,
      script: [
        { text: `$ serve . (${pad.files.length} files)`, delay: 150 },
        { text: `Serving ${pad.entry} with ${pad.files.filter((f) => f.path.endsWith(".css")).length} stylesheet(s) and ${pad.files.filter((f) => f.path.endsWith(".js")).length} script(s)`, delay: 350 },
        { text: "Preview is live in the panel on the right.", delay: 150 },
      ],
    }
  }
  if (pad.runtime === "python") {
    // Echo what the script would print when it's the starter; otherwise a generic run.
    const names = entry?.content.match(/\["([^\]]+)"\]/)?.[1]?.split(/",\s*"/) ?? []
    const day = new Date().toLocaleDateString("en-GB", { weekday: "long" })
    const broken = entry && /\bprint\(\s*$/m.test(entry.content)
    return broken
      ? {
          exitCode: 1,
          script: [
            { text: `$ python ${pad.entry}`, delay: 200 },
            { text: `  File "${pad.entry}", line ${entry.content.split("\n").findIndex((l) => /\bprint\(\s*$/.test(l)) + 1}`, stream: "stderr", delay: 500 },
            { text: "SyntaxError: '(' was never closed", stream: "stderr", delay: 60 },
          ],
        }
      : {
          exitCode: 0,
          script: [
            { text: `$ python ${pad.entry}`, delay: 200 },
            ...(names.length ? names.map((n, i) => ({ text: `Hello, ${n}! Today is ${day}.`, delay: i === 0 ? 600 : 80 })) : [{ text: "(no output)", delay: 600 }]),
            { text: "Process finished with exit code 0", delay: 120 },
          ],
        }
  }
  return {
    exitCode: 0,
    script: [
      { text: `$ node ${pad.entry}`, delay: 200 },
      { text: "Listening on http://localhost:3000", delay: 700 },
      { text: "GET / 200 3ms", delay: 900 },
      { text: "Run ended — runs in CodePad are short and time-limited.", delay: 1200 },
    ],
  }
}

export const mockRuns = {
  start(pad: Pad) {
    const id = `run_${nextRun++}`
    runs.set(id, { startedAt: Date.now(), ...scriptFor(pad) })
    return id
  },
  logs(id: string, after: number): RunLogs | null {
    const run = runs.get(id)
    if (!run) return null
    const elapsed = Date.now() - run.startedAt
    let t = 0
    const due = run.script.flatMap((line, i) => {
      t += line.delay
      return t <= elapsed ? [{ n: i + 1, at: new Date(run.startedAt + t).toISOString(), text: line.text, stream: line.stream ?? ("stdout" as const) }] : []
    })
    const done = due.length === run.script.length
    return { lines: due.filter((l) => l.n > after), done, exitCode: done ? run.exitCode : null }
  },
}
