import { cn } from "@/lib/utils"
import { storageActions, storageFiles } from "@/content/workspace"
import { Icon, type IconName } from "@/components/shared/icon"
import { ProductWindow } from "@/components/marketing/product-window"

const kindIcon: Record<(typeof storageFiles)[number]["kind"], IconName> = {
  folder: "folder",
  image: "image",
  file: "file-text",
  archive: "file-archive",
}

/** Storage — conventional mechanics (brief §3): usage, folders, upload, new folder, search, sort, delete. */
export function StorageMock({ className }: { className?: string }) {
  return (
    <ProductWindow title="your galley / storage / orders-api" className={className}>
      <div className="grid gap-4 border-b border-border/70 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <p className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-heading text-lg font-semibold tracking-tight">Storage</span>
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-foreground">312 MB</span> of 1 GB
            </span>
          </p>
          <div className="flex h-1.5 gap-px bg-muted" role="img" aria-label="312 MB of 1 GB used">
            <div className="h-full w-[18%] bg-foreground" />
            <div className="h-full w-[9%] bg-brand" />
            <div className="h-full w-[4%] bg-muted-foreground/50" />
          </div>
        </div>
        <span className="font-mono text-[0.625rem] text-muted-foreground sm:text-right">illustrative quota</span>
      </div>

      <div className="flex flex-wrap items-center gap-px border-b border-border/70 bg-border/70">
        {storageActions.map((action) => (
          <span
            key={action.label}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 px-3 text-[0.6875rem] font-medium",
              action.label === "Upload" ? "bg-foreground text-background" : "bg-card",
              action.label === "Delete" && "text-destructive"
            )}
          >
            <Icon name={action.icon} size="xs" />
            {action.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
              <th scope="col" className="px-5 py-2.5 font-medium">Name</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Size</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Modified</th>
            </tr>
          </thead>
          <tbody>
            {storageFiles.map((file, i) => (
              <tr key={file.name} className={cn("border-b border-border/70 last:border-b-0", i === 2 && "bg-brand/5")}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <Icon name={kindIcon[file.kind]} size="xs" className={file.kind === "folder" ? "text-brand-ink" : "text-muted-foreground"} />
                    <span className={cn("font-mono text-xs", file.kind === "folder" && "font-medium")}>{file.name}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">{file.size}</td>
                <td className="px-5 py-3 text-right text-xs text-muted-foreground">{file.modified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProductWindow>
  )
}
