import type { IconName } from "@/components/shared/icon"

export type { IconName }

/** Generic feature item — rendered as cards, matrix cells, list items, bento cells or timeline steps. */
export type FeatureItem = {
  title: string
  description: string
  icon: IconName
}

export type NavLink = {
  label: string
  href: string
  description?: string
  icon?: IconName
}

export type NavGroup = {
  title: string
  links: readonly NavLink[]
}

/**
 * Long-form content block — rendered by <ContentBlocks> inside <Prose> for blog, docs and legal.
 * Inline `backticks` in text render as code.
 */
export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: readonly string[] }
  | { type: "ol"; items: readonly string[] }
  | { type: "code"; code: string; title?: string }
  | { type: "callout"; title?: string; text: string }
