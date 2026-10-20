"use client"

import * as React from "react"

import { useFolders } from "@/features/storage/storage"
import { folderHref } from "@/features/storage/components/storage-browser"
import { useCommandPalette, useRegisterCommands } from "@/components/command-palette/command-palette-provider"
import type { CommandSource } from "@/components/command-palette/types"

/**
 * Storage in the ⌘K palette from anywhere: "Go to folder…" lists every folder in the drive.
 * The list is only fetched while the palette is open.
 */
export function StorageCommands() {
  const { isOpen } = useCommandPalette()
  const { data } = useFolders(isOpen)

  const source = React.useMemo<CommandSource>(
    () => ({
      commands: [
        { id: "storage-go-to-folder", label: "Go to folder…", subtitle: "Storage", group: "Storage", kind: "action", icon: "folder", keywords: ["storage", "files", "browse"], page: "storage-folders" },
      ],
      pages: [
        {
          id: "storage-folders",
          title: "Go to folder",
          placeholder: "Search folders…",
          commands: ["", ...(data?.folders ?? [])].map((folder) => ({
            id: `storage-folder:${folder || "(top)"}`,
            label: folder ? folder.split("/").pop()! : "Storage",
            subtitle: folder ? `/${folder}` : "The top of your drive",
            group: "Folders",
            kind: "page" as const,
            icon: folder ? ("folder" as const) : ("database" as const),
            href: folderHref(folder),
          })),
        },
      ],
    }),
    [data]
  )
  useRegisterCommands("storage", source)
  return null
}
