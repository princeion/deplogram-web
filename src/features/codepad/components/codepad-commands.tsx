"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { runtimes } from "@/content/runtimes"
import { padsQuery } from "@/features/codepad/codepad"
import { useCommandPalette, useRegisterCommands } from "@/components/command-palette/command-palette-provider"
import type { CommandSource } from "@/components/command-palette/types"

/**
 * CodePad in the ⌘K palette from anywhere in the Galley: "New pad", and "Open pad…" listing your
 * pads. The list is only fetched while the palette is open.
 */
export function CodepadCommands() {
  const { isOpen } = useCommandPalette()
  const { data: pads } = useQuery({ ...padsQuery(), enabled: isOpen })

  const source = React.useMemo<CommandSource>(
    () => ({
      commands: [
        { id: "codepad-new", label: "New pad", subtitle: "CodePad", group: "CodePad", kind: "action", icon: "plus", keywords: ["codepad", "create", "editor", "code"], href: "/dashboard/codepad?new=1" },
        { id: "codepad-open", label: "Open pad…", subtitle: "CodePad", group: "CodePad", kind: "action", icon: "code", keywords: ["codepad", "editor", "switch"], page: "codepad-pads" },
      ],
      pages: [
        {
          id: "codepad-pads",
          title: "Open pad",
          placeholder: "Search your pads…",
          commands: (pads ?? []).map((pad) => ({
            id: `pad:${pad.id}`,
            label: pad.name,
            subtitle: runtimes.find((r) => r.id === pad.runtime)?.name ?? pad.runtime,
            group: "Pads",
            kind: "page" as const,
            icon: runtimes.find((r) => r.id === pad.runtime)?.icon ?? ("code" as const),
            href: `/dashboard/codepad/${pad.id}`,
          })),
        },
      ],
    }),
    [pads]
  )
  useRegisterCommands("codepad", source)
  return null
}
