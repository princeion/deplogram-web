import type { IconName } from "@/content/types"
import { BadgePill } from "@/components/shared/badge-pill"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

type StoragePreviewProps = {
  files: readonly { path: string; size: string; icon: IconName }[]
}

/** Illustrative storage bucket listing for the Storage panel. */
export function StoragePreview({ files }: StoragePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-background/60 p-4 sm:p-5">
      <div aria-hidden className="absolute inset-0 bg-dot-grid mask-fade-edges" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Icon name="database" className="text-muted-foreground" />
          <span className="font-medium">myapp</span>
          <span className="text-muted-foreground">/ storage</span>
        </div>
        <BadgePill dot>Persistent</BadgePill>
      </div>
      <StaggerGroup as="ul" className="relative mt-5 flex flex-col gap-2">
        {files.map((file) => (
          <StaggerItem
            as="li"
            key={file.path}
            className="flex items-center gap-3 rounded-lg elevation-control px-3 py-2.5 text-xs"
          >
            <Icon name={file.icon} className="text-brand-ink" />
            <span className="min-w-0 flex-1 truncate font-mono text-foreground">{file.path}</span>
            <span className="shrink-0 font-mono text-muted-foreground">{file.size}</span>
          </StaggerItem>
        ))}
      </StaggerGroup>
      <p className="relative mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="refresh-cw" size="xs" />
        Redeployed 2 min ago · no files changed
      </p>
    </div>
  )
}
