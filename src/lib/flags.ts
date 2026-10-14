/**
 * Feature flags for the app. Turn an area on or off per environment with NEXT_PUBLIC_FLAG_<NAME>
 * ("true" / "false"); the default applies when the variable is unset. Read at build time.
 */
const flagDefaults = {
  codepad: true,
  storage: true,
  utilities: true,
  apis: true,
} as const

export type FeatureFlag = keyof typeof flagDefaults

// Spelled out (not a dynamic lookup) so Next.js can inline NEXT_PUBLIC_ values into client code.
const overrides: Partial<Record<FeatureFlag, string | undefined>> = {
  codepad: process.env.NEXT_PUBLIC_FLAG_CODEPAD,
  storage: process.env.NEXT_PUBLIC_FLAG_STORAGE,
  utilities: process.env.NEXT_PUBLIC_FLAG_UTILITIES,
  apis: process.env.NEXT_PUBLIC_FLAG_APIS,
}

export function isFlagEnabled(flag: FeatureFlag): boolean {
  const value = overrides[flag]
  if (value === "true") return true
  if (value === "false") return false
  return flagDefaults[flag]
}
