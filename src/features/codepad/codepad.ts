import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiFetch } from "@/lib/api-client"

/**
 * CodePad: small standalone projects ("pads") edited in the browser — a few files and a runtime —
 * that can be run, previewed and deployed as a real project. Endpoint shapes are the frontend's
 * proposal until the backend contract is agreed; src/mocks/handlers.ts implements them meanwhile.
 *
 *   GET    /v1/pads                      → PadSummary[]
 *   POST   /v1/pads  { name, template }  → Pad
 *   GET    /v1/pads/:id                  → Pad
 *   PATCH  /v1/pads/:id  { name }        → Pad
 *   DELETE /v1/pads/:id                  → 204
 *   PUT    /v1/pads/:id/files  { path, content }   → PadFile (create or save)
 *   POST   /v1/pads/:id/files/rename  { from, to } → Pad
 *   DELETE /v1/pads/:id/files?path=…               → Pad
 *   POST   /v1/pads/:id/runs             → { id }
 *   GET    /v1/runs/:id/logs?after=n     → { lines, done, exitCode }
 */

export const padTemplates = [
  { id: "static", runtime: "static", label: "Static site", description: "HTML, CSS and JavaScript, with a live preview." },
  { id: "node", runtime: "node", label: "Node.js", description: "A small HTTP server on Node 22." },
  { id: "python", runtime: "python", label: "Python", description: "A Python 3.12 script." },
] as const
export type PadTemplate = (typeof padTemplates)[number]["id"]

export const padFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  updatedAt: z.string(),
})
export type PadFile = z.infer<typeof padFileSchema>

export const padSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  runtime: z.string(),
  fileCount: z.number(),
  updatedAt: z.string(),
  /** Set once the pad has been deployed: the project it became. */
  projectId: z.string().nullable(),
})
export type PadSummary = z.infer<typeof padSummarySchema>

export const padSchema = padSummarySchema.omit({ fileCount: true }).extend({
  files: z.array(padFileSchema),
  /** The file to open first. */
  entry: z.string(),
})
export type Pad = z.infer<typeof padSchema>

export const runLogLineSchema = z.object({
  n: z.number(),
  at: z.string(),
  text: z.string(),
  stream: z.enum(["stdout", "stderr"]),
})
export const runLogsSchema = z.object({
  lines: z.array(runLogLineSchema),
  done: z.boolean(),
  /** null while running. */
  exitCode: z.number().nullable(),
})
export type RunLogs = z.infer<typeof runLogsSchema>

export const padKeys = {
  all: ["pads"] as const,
  list: () => [...padKeys.all, "list"] as const,
  detail: (id: string) => [...padKeys.all, "detail", id] as const,
  run: (runId: string) => [...padKeys.all, "run", runId] as const,
}

export const padsQuery = () =>
  queryOptions({
    queryKey: padKeys.list(),
    queryFn: () => apiFetch("/v1/pads", { schema: z.array(padSummarySchema) }),
  })

export function usePads() {
  return useQuery(padsQuery())
}

export const padQuery = (id: string) =>
  queryOptions({
    queryKey: padKeys.detail(id),
    queryFn: () => apiFetch(`/v1/pads/${id}`, { schema: padSchema }),
    // The editor holds the working copy; don't refetch underneath someone's typing.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

export function usePad(id: string) {
  return useQuery(padQuery(id))
}

export function useCreatePad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; template: PadTemplate }) => apiFetch("/v1/pads", { method: "POST", json: input, schema: padSchema }),
    onSuccess: (pad) => {
      queryClient.setQueryData(padKeys.detail(pad.id), pad)
      void queryClient.invalidateQueries({ queryKey: padKeys.list() })
    },
  })
}

export function useRenamePad(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => apiFetch(`/v1/pads/${id}`, { method: "PATCH", json: { name }, schema: padSchema }),
    onSuccess: (pad) => {
      queryClient.setQueryData(padKeys.detail(id), pad)
      void queryClient.invalidateQueries({ queryKey: padKeys.list() })
    },
  })
}

export function useDeletePad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/pads/${id}`, { method: "DELETE", schema: z.null() }),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: padKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: padKeys.list() })
    },
  })
}

/** Create or save one file. The editor keeps its own buffers, so the cache isn't touched here. */
export function useSaveFile(padId: string) {
  return useMutation({
    mutationFn: (file: { path: string; content: string }) =>
      apiFetch(`/v1/pads/${padId}/files`, { method: "PUT", json: file, schema: padFileSchema }),
  })
}

export function useRenameFile(padId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { from: string; to: string }) =>
      apiFetch(`/v1/pads/${padId}/files/rename`, { method: "POST", json: input, schema: padSchema }),
    onSuccess: (pad) => queryClient.setQueryData(padKeys.detail(padId), pad),
  })
}

export function useDeleteFile(padId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (path: string) =>
      apiFetch(`/v1/pads/${padId}/files?path=${encodeURIComponent(path)}`, { method: "DELETE", schema: padSchema }),
    onSuccess: (pad) => queryClient.setQueryData(padKeys.detail(padId), pad),
  })
}

/** Start a run of the pad's saved files. */
export function useRunPad(padId: string) {
  return useMutation({
    mutationFn: () => apiFetch(`/v1/pads/${padId}/runs`, { method: "POST", schema: z.object({ id: z.string() }) }),
  })
}

/**
 * A run's output, streamed like a build log: each fetch asks only for lines after the last one we
 * have and appends them, polling until the run ends.
 */
export function useRunLogs(runId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = padKeys.run(runId ?? "none")
  return useQuery({
    queryKey,
    enabled: runId != null,
    queryFn: async (): Promise<RunLogs> => {
      const previous = queryClient.getQueryData<RunLogs>(queryKey)
      const after = previous?.lines.at(-1)?.n ?? 0
      const next = await apiFetch(`/v1/runs/${runId}/logs?after=${after}`, { schema: runLogsSchema })
      return { ...next, lines: after ? [...previous!.lines, ...next.lines] : next.lines }
    },
    refetchInterval: (query) => (query.state.data?.done ? false : 600),
    staleTime: Infinity,
  })
}

/** Monaco language id for a file path. */
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
    txt: "plaintext",
  }
  return map[ext] ?? "plaintext"
}
