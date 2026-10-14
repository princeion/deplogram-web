import { z } from "zod"

/** One environment variable row in a form. */
export type EnvVar = { key: string; value: string }

/** Shell-safe variable names: letters, digits and underscores, not starting with a digit. */
export const envVarKeySchema = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use letters, numbers and underscores, not starting with a number")

/** A list of variables with unique names (duplicates are flagged on the later row). */
export const envVarsSchema = z.array(z.object({ key: envVarKeySchema, value: z.string() })).superRefine((rows, ctx) => {
  const seen = new Map<string, number>()
  rows.forEach((row, index) => {
    const key = row.key.trim()
    if (!key) return
    if (seen.has(key)) ctx.addIssue({ code: "custom", path: [index, "key"], message: `${key} is already defined above` })
    else seen.set(key, index)
  })
})

/**
 * Parses .env text: KEY=VALUE per line, `export ` prefixes, # comments and blank lines ignored,
 * surrounding quotes removed. Later duplicates win.
 */
export function parseDotEnv(text: string): EnvVar[] {
  const vars = new Map<string, string>()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.replace(/^export\s+/, "").match(/^([^=\s]+)\s*=\s*(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    const quote = value[0]
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, "")
    vars.set(match[1], value)
  }
  return [...vars].map(([key, value]) => ({ key, value }))
}
