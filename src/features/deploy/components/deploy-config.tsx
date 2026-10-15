"use client"

import * as React from "react"
import { useFormContext, useFormState, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { runtimes } from "@/content/runtimes"
import { staticRuntimes, useNameAvailability, type Branch, type Detection, type Repository } from "@/features/deploy/deploy"
import { projectNameSchema, type NewDeploymentValues } from "@/features/deploy/components/schema"
import { EnvTable } from "@/features/deploy/components/env-table"
import { useUsage } from "@/features/usage/usage"
import { Icon, type IconName } from "@/components/shared/icon"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FormRootError } from "@/components/forms"

// ── Fact tiles ─────────────────────────────────────────────────────────────────────

function Tile({ label, icon, children, className }: { label: string; icon: IconName; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("surface-raised grid min-w-0 content-start gap-1.5 rounded-xl px-3.5 py-3", className)}>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name={icon} size="xs" />
        {label}
      </span>
      <div className="min-w-0 truncate font-mono text-[0.8125rem]">{children}</div>
    </div>
  )
}

function BranchTile({ branches, loading }: { branches?: Branch[]; loading: boolean }) {
  const { control, setValue } = useFormContext<NewDeploymentValues>()
  const branch = useWatch({ control, name: "branch" })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={loading}
            className="surface-raised grid min-w-0 content-start gap-1.5 rounded-xl px-3.5 py-3 text-left transition-colors outline-none hover:bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_5%)] focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="git-branch" size="xs" />
          Branch
          <Icon name="chevrons-up-down" size="xs" className="ml-auto" />
        </span>
        <span className="truncate font-mono text-[0.8125rem]">{loading ? "…" : branch || "Choose"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {branches?.map((b) => (
          <DropdownMenuItem key={b.name} onClick={() => setValue("branch", b.name, { shouldDirty: true, shouldValidate: true })}>
            <Icon name="git-branch" />
            <span className="grid min-w-0">
              <span className="truncate font-mono text-xs">{b.name}</span>
              <span className="truncate text-xs text-muted-foreground">{b.commit.message}</span>
            </span>
            {b.name === branch && <Icon name="check" size="xs" className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Runtime segment ────────────────────────────────────────────────────────────────

function RuntimeSegment({ detected }: { detected?: string | null }) {
  const { control, setValue } = useFormContext<NewDeploymentValues>()
  const runtime = useWatch({ control, name: "runtime" })
  const { errors } = useFormState({ control, name: "runtime" })
  return (
    <div className="grid gap-2">
      <div role="radiogroup" aria-label="Runtime" aria-invalid={Boolean(errors.runtime)} className="flex flex-wrap gap-1.5">
        {runtimes.map((r) => {
          const selected = runtime === r.id
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setValue("runtime", r.id, { shouldDirty: true, shouldValidate: true })}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                selected
                  ? "surface-raised bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_8%)] text-foreground ring-1 ring-foreground/35"
                  : "surface-raised text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon name={r.icon} size="xs" filled={selected} />
              {r.name}
              {r.id === detected && <span className="font-mono text-[0.625rem] text-success">auto</span>}
            </button>
          )
        })}
      </div>
      {errors.runtime && <p className="text-xs text-destructive">{errors.runtime.message}</p>}
    </div>
  )
}

// ── Settings table ─────────────────────────────────────────────────────────────────

const inlineInput =
  "h-8 w-full min-w-0 rounded-md bg-transparent px-2 font-mono text-[0.8125rem] outline-none ring-1 ring-transparent transition-[box-shadow,background-color] placeholder:text-muted-foreground/50 hover:bg-foreground/[0.04] focus:surface-sunken focus:ring-ring/50 aria-invalid:ring-destructive/60"

function SettingRow({ label, htmlFor, error, aside, children }: { label: string; htmlFor: string; error?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid border-b border-border/50 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      {/* The darker label column: a two-tone table. */}
      <label htmlFor={htmlFor} className="surface-band flex items-center px-3.5 pt-2.5 text-sm text-muted-foreground sm:border-r sm:border-border/50 sm:py-2.5">
        {label}
      </label>
      <div className="grid gap-1 px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {children}
          {aside}
        </div>
        {error && <p className="px-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function NameStatus() {
  const { control } = useFormContext<NewDeploymentValues>()
  const name = useWatch({ control, name: "name" })?.trim() ?? ""
  const [debounced, setDebounced] = React.useState(name)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(name), 350)
    return () => window.clearTimeout(id)
  }, [name])
  const valid = projectNameSchema.safeParse(debounced).success
  const { data, isFetching } = useNameAvailability(valid ? debounced : "")
  if (!name || !valid) return null
  if (isFetching || debounced !== name) return <Spinner className="size-3.5 shrink-0 text-muted-foreground" />
  if (!data) return null
  return data.available ? (
    <span className="flex shrink-0 items-center gap-1 text-xs text-success">
      <Icon name="check" size="xs" />
      Available
    </span>
  ) : (
    <span className="shrink-0 text-xs text-destructive">Taken{data.suggestion ? ` · try ${data.suggestion}` : ""}</span>
  )
}

function SettingsTable() {
  const { control, register } = useFormContext<NewDeploymentValues>()
  const { errors } = useFormState({ control })
  const runtime = useWatch({ control, name: "runtime" })
  const isStatic = staticRuntimes.includes(runtime)
  return (
    <div className="surface-raised overflow-hidden rounded-xl">
      <SettingRow label="Project name" htmlFor="cfg-name" error={errors.name?.message} aside={<NameStatus />}>
        <span className="flex min-w-0 flex-1 items-center">
          <input id="cfg-name" {...register("name")} aria-invalid={Boolean(errors.name)} autoComplete="off" spellCheck={false} placeholder="my-project" className={cn(inlineInput, "rounded-r-none")} />
          <span className="surface-band flex h-8 items-center rounded-r-md px-2 font-mono text-[0.8125rem] text-muted-foreground">.dpl.app</span>
        </span>
      </SettingRow>
      <SettingRow label="Build" htmlFor="cfg-build" error={errors.buildCommand?.message}>
        <input id="cfg-build" {...register("buildCommand")} spellCheck={false} placeholder="nothing to build" className={inlineInput} />
      </SettingRow>
      {isStatic ? (
        <div className="grid border-b border-border/50 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <span className="surface-band flex items-center px-3.5 pt-2.5 text-sm text-muted-foreground sm:border-r sm:border-border/50 sm:py-2.5">Serve</span>
          <span className="px-4 py-2.5 text-sm text-muted-foreground">Build output as static files — no start command or port.</span>
        </div>
      ) : (
        <>
          <SettingRow label="Start" htmlFor="cfg-start" error={errors.startCommand?.message}>
            <input
              id="cfg-start"
              {...register("startCommand")}
              aria-invalid={Boolean(errors.startCommand)}
              spellCheck={false}
              placeholder={runtime === "docker" ? "CMD from the Dockerfile" : "npm start"}
              className={inlineInput}
            />
          </SettingRow>
          <SettingRow label="Port" htmlFor="cfg-port" error={errors.port?.message}>
            <input id="cfg-port" {...register("port")} aria-invalid={Boolean(errors.port)} inputMode="numeric" placeholder="3000" className={cn(inlineInput, "max-w-28")} />
          </SettingRow>
        </>
      )}
      <SettingRow label="Root directory" htmlFor="cfg-root" error={errors.rootDirectory?.message}>
        <input id="cfg-root" {...register("rootDirectory")} spellCheck={false} placeholder="./" className={inlineInput} />
      </SettingRow>
    </div>
  )
}

// ── The pane ───────────────────────────────────────────────────────────────────────

function Section({ title, meta, children }: { title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {meta && <span className="font-mono text-[0.6875rem] text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </section>
  )
}

function DeployBar({ submitting }: { submitting: boolean }) {
  const { control } = useFormContext<NewDeploymentValues>()
  const name = useWatch({ control, name: "name" })?.trim()
  const { data } = useUsage()
  const live = data?.limits.find((l) => l.id === "active_deployments")
  const full = live ? live.used >= live.limit : false
  const emptyValues = (useWatch({ control, name: "env" }) ?? []).filter((row) => row?.key && !row.value).length
  return (
    <div className="surface-sunken sticky bottom-0 z-10 border-t border-border/60 px-4 py-3 sm:px-5">
      <FormRootError className="mb-3" />
      {full && <p className="mb-2 text-xs text-destructive">All {live!.limit} live deployments on your plan are in use. Take a project offline to deploy another.</p>}
      {emptyValues > 0 && (
        <p className="mb-2 text-xs text-brand-ink">
          {emptyValues === 1 ? "1 variable has" : `${emptyValues} variables have`} no value and will be set to an empty string.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm">
          <span className="text-muted-foreground">https://</span>
          {name || <span className="text-muted-foreground/60">your-project</span>}
          <span className="text-muted-foreground">.dpl.app</span>
        </span>
        {live && (
          <span className="font-mono text-[0.6875rem] text-muted-foreground tabular-nums" title="Live deployments on your plan, after this one">
            live {Math.min(live.used + 1, live.limit)}/{live.limit}
          </span>
        )}
        <Button type="submit" loading={submitting} disabled={full}>
          <Icon name="rocket" />
          Deploy
        </Button>
      </div>
    </div>
  )
}

/**
 * The detail pane for the chosen repository: facts first (branch, commit, detected runtime),
 * then the runtime, the settings as an editable table, the environment, and a sticky bar with
 * the URL and Deploy. Compact on purpose — every value is visible and editable in place.
 */
export function DeployConfig({
  repository,
  branches,
  branchesLoading,
  detection,
  detecting,
  submitting,
}: {
  repository: Repository
  branches?: Branch[]
  branchesLoading: boolean
  detection?: Detection
  detecting: boolean
  submitting: boolean
}) {
  const { control } = useFormContext<NewDeploymentValues>()
  const branchName = useWatch({ control, name: "branch" })
  const head = branches?.find((b) => b.name === branchName)
  const detectedRuntime = runtimes.find((r) => r.id === detection?.runtime)
  const [owner, name] = repository.fullName.split("/")

  return (
    <div className="flex min-h-full flex-col">
      <div className="grid gap-6 p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 className="text-xl font-medium tracking-tight">{name}</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {owner}/{name} · {repository.private ? "private" : "public"} · updated {formatRelativeTime(repository.updatedAt)}
            </p>
          </div>
          {repository.projectId && (
            <span className="rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">Already deployed — this creates a second project</span>
          )}
        </header>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <BranchTile branches={branches} loading={branchesLoading} />
          <Tile label="Commit" icon="git-commit">
            {head ? (
              <>
                {head.commit.sha} <span className="font-sans text-muted-foreground">{head.commit.message}</span>
              </>
            ) : (
              "…"
            )}
          </Tile>
          <Tile label="Detected" icon="scan-search">
            {detecting ? (
              <span className="animate-text-shimmer bg-[linear-gradient(110deg,var(--muted-foreground)_40%,var(--foreground)_50%,var(--muted-foreground)_60%)] bg-size-[250%_100%] bg-clip-text font-sans text-transparent">
                Inspecting…
              </span>
            ) : detectedRuntime ? (
              <>
                <span className="font-sans">{detectedRuntime.name}</span> <span className="text-muted-foreground">{detection?.evidence}</span>
              </>
            ) : (
              <span className="font-sans text-muted-foreground">Nothing recognised</span>
            )}
          </Tile>
          <Tile label="Env example" icon="file-text">
            {detecting ? "…" : detection?.envExample.length ? `${detection.envExample.length} variables` : <span className="font-sans text-muted-foreground">None</span>}
          </Tile>
        </div>

        <Section title="Runtime" meta={detectedRuntime ? `detected from ${detection?.evidence}` : undefined}>
          <RuntimeSegment detected={detection?.runtime} />
        </Section>

        <Section title="Settings">
          <SettingsTable />
        </Section>

        <Section title="Environment" meta="encrypted · values never shown again in full">
          <EnvTable suggestions={detection?.envExample} />
        </Section>
      </div>

      <div className="mt-auto">
        <DeployBar submitting={submitting} />
      </div>
    </div>
  )
}
