import { API_BASE_URL, type TryRequest } from "@/features/apis/apis"

export type SnippetLanguage = "curl" | "javascript" | "python"

export const snippetLanguages: { value: SnippetLanguage; label: string; file: string }[] = [
  { value: "curl", label: "curl", file: "request.sh" },
  { value: "javascript", label: "JavaScript", file: "request.js" },
  { value: "python", label: "Python", file: "request.py" },
]

const indent = (text: string, by: string) => text.replace(/\n/g, `\n${by}`)

/** JSON → a Python literal: true/false/null become True/False/None. */
function toPython(value: unknown, depth = 0): string {
  const pad = "    ".repeat(depth + 1)
  const close = "    ".repeat(depth)
  if (value === null || value === undefined) return "None"
  if (value === true) return "True"
  if (value === false) return "False"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return JSON.stringify(value)
  if (Array.isArray(value)) return value.length ? `[${value.map((v) => toPython(v, depth)).join(", ")}]` : "[]"
  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return "{}"
  return `{\n${entries.map(([k, v]) => `${pad}${JSON.stringify(k)}: ${toPython(v, depth + 1)},`).join("\n")}\n${close}}`
}

/** The same request as a copy-pasteable call, authenticated with DEPLOGRAM_KEY from the environment. */
export function snippet(language: SnippetLanguage, request: TryRequest): string {
  const url = `${API_BASE_URL}${request.path}`
  const hasBody = request.method !== "GET" && request.body !== undefined
  const json = hasBody ? JSON.stringify(request.body, null, 2) : ""

  if (language === "curl") {
    return [
      `curl${request.method === "GET" ? "" : ` -X ${request.method}`} ${url} \\`,
      `  -H "Authorization: Bearer $DEPLOGRAM_KEY"${hasBody ? " \\" : ""}`,
      ...(hasBody ? [`  -H "Content-Type: application/json" \\`, `  -d '${json.replace(/'/g, "'\\''")}'`] : []),
    ].join("\n")
  }

  if (language === "javascript") {
    return [
      `const response = await fetch("${url}", {`,
      ...(request.method !== "GET" ? [`  method: "${request.method}",`] : []),
      `  headers: {`,
      "    Authorization: `Bearer ${process.env.DEPLOGRAM_KEY}`,",
      ...(hasBody ? [`    "Content-Type": "application/json",`] : []),
      `  },`,
      ...(hasBody ? [`  body: JSON.stringify(${indent(json, "  ")}),`] : []),
      `})`,
      `const data = await response.json()`,
    ].join("\n")
  }

  return [
    `import os`,
    `import requests`,
    ``,
    `response = requests.${request.method.toLowerCase()}(`,
    `    "${url}",`,
    `    headers={"Authorization": f"Bearer {os.environ['DEPLOGRAM_KEY']}"},`,
    ...(hasBody ? [`    json=${toPython(request.body, 1)},`] : []),
    `)`,
    `data = response.json()`,
  ].join("\n")
}
