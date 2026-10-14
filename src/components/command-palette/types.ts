import type * as React from "react"

import type { IconName } from "@/components/shared/icon"

/** What a command is — drives the `>` (actions) and `@` (projects) search prefixes. */
export type CommandKind = "page" | "project" | "action" | "help"

export type PaletteCommand = {
  id: string
  label: string
  /** Group heading it's listed under. */
  group: string
  kind: CommandKind
  icon?: IconName
  /** Custom leading visual instead of an icon (e.g. a project's status dot). */
  leading?: React.ReactNode
  /** Secondary text after the label (a scope, a URL). */
  subtitle?: string
  keywords?: readonly string[]
  /** Key hint shown on the right, e.g. ["mod", "B"] ("mod" = ⌘ on Mac, Ctrl elsewhere). */
  shortcut?: readonly string[]
  /** Navigate here when chosen. */
  href?: string
  /** Open `href` in a new tab. */
  external?: boolean
  /** Run when chosen (after navigation, if both are set). */
  perform?: () => void
  /** Open this sub-page of commands instead of running. */
  page?: string
  /** Remember in "Recent" when chosen. Default: true for navigation, false for actions. */
  recent?: boolean
}

/** A nested list (e.g. "Switch project…"), opened by a command's `page`. */
export type PalettePage = {
  id: string
  title: string
  placeholder?: string
  commands: PaletteCommand[]
}

/** Commands and pages a part of the app contributes while it's mounted. */
export type CommandSource = {
  commands?: PaletteCommand[]
  pages?: PalettePage[]
}
