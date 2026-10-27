"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useController, useWatch } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { siteConfig } from "@/lib/site"
import { useDeleteProject, useProject, useUpdateProject, type Project, type ProjectUpdate } from "@/features/projects/projects"
import { useBranches, useNameAvailability, useRepositories } from "@/features/deploy/deploy"
import { projectNameSchema } from "@/features/deploy/components/schema"
import { useDeployment } from "@/features/deployments/deployments"
import { useDeploymentActions } from "@/features/deployments/components/use-deployment-actions"
import { ProjectGate } from "@/features/projects/components/project-gate"
import { PageHeader } from "@/components/app-shell/page"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SettingRow, SettingsTable, settingInputClass } from "@/components/shared/settings-table"
import { notify, useConfirm } from "@/components/feedback"
import { Form, FormRootError, UnsavedChangesGuard, useZodForm } from "@/components/forms"

const settingsSchema = z
  .object({
    name: projectNameSchema,
    branch: z.string().min(1, "Choose a branch"),
    buildCommand: z.string().trim(),
    startCommand: z.string().trim(),
    port: z.string().trim(),
    rootDirectory: z.string().trim(),
    isStatic: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.isStatic) return
    const port = Number(v.port)
    if (!v.port || !Number.isInteger(port) || port < 1 || port > 65535) ctx.addIssue({ code: "custom", path: ["port"], message: "Enter the port your app listens on (1–65535)" })
  })
type SettingsValues = z.input<typeof settingsSchema>

const valuesFrom = (p: Project): SettingsValues => ({
  name: p.name,
  branch: p.branch,
  buildCommand: p.config.buildCommand ?? "",
  startCommand: p.config.startCommand ?? "",
  port: p.config.port ? String(p.config.port) : "",
  rootDirectory: p.config.rootDirectory ?? "",
  isStatic: p.config.port === null,
})

function NameStatus({ control, current }: { control: ReturnType<typeof useZodForm<typeof settingsSchema>>["control"]; current: string }) {
  const name = useWatch({ control, name: "name" })?.trim() ?? ""
  const [debounced, setDebounced] = React.useState(name)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(name), 350)
    return () => window.clearTimeout(id)
  }, [name])
  const changed = debounced !== current && projectNameSchema.safeParse(debounced).success
  const { data, isFetching } = useNameAvailability(changed ? debounced : "")
  if (name === current || !changed) return null
  if (isFetching || debounced !== name) return <Spinner className="size-3.5 shrink-0 text-muted-foreground" />
  if (!data) return null
  return data.available ? <span className="shrink-0 text-xs text-success">Available</span> : <span className="shrink-0 text-xs text-destructive">Taken</span>
}

function BranchPicker({ control, repository }: { control: ReturnType<typeof useZodForm<typeof settingsSchema>>["control"]; repository: string }) {
  const { field } = useController({ control, name: "branch" })
  const repos = useRepositories("")
  const repoId = repos.data?.find((r) => r.fullName === repository)?.id
  const branches = useBranches(repoId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className={cn(settingInputClass, "flex items-center gap-2 text-left")}>
            <Icon name="git-branch" size="xs" className="text-muted-foreground" />
            <span className="flex-1 truncate">{field.value}</span>
            <Icon name="chevrons-up-down" size="xs" className="text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {branches.isPending ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Loading branches…</p>
        ) : (
          branches.data?.map((b) => (
            <DropdownMenuItem key={b.name} onClick={() => field.onChange(b.name)}>
              <Icon name="git-branch" />
              <span className="grid min-w-0">
                <span className="truncate font-mono text-xs">{b.name}</span>
                <span className="truncate text-xs text-muted-foreground">{b.commit.message}</span>
              </span>
              {b.name === field.value && <Icon name="check" size="xs" className="ml-auto" />}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2.5">
      <div className="grid gap-0.5">
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function SettingsForm({ project }: { project: Project }) {
  const router = useRouter()
  const confirm = useConfirm()
  const form = useZodForm(settingsSchema, { defaultValues: valuesFrom(project) })
  const { register, control, formState } = form
  const update = useUpdateProject(project.id)
  const remove = useDeleteProject(project.id)
  const latest = useDeployment(project.latest?.id ?? "")
  const { startRedeploy } = useDeploymentActions()
  const isStatic = project.config.port === null

  const onSubmit = async (v: SettingsValues) => {
    const changes: ProjectUpdate = {}
    if (v.name !== project.name) changes.name = v.name.trim()
    if (v.branch !== project.branch) changes.branch = v.branch
    const config: NonNullable<ProjectUpdate["config"]> = {}
    if (v.buildCommand !== (project.config.buildCommand ?? "")) config.buildCommand = v.buildCommand || null
    if (!isStatic && v.startCommand !== (project.config.startCommand ?? "")) config.startCommand = v.startCommand || null
    if (!isStatic && v.port !== String(project.config.port ?? "")) config.port = Number(v.port)
    if (v.rootDirectory !== (project.config.rootDirectory ?? "")) config.rootDirectory = v.rootDirectory || null
    if (Object.keys(config).length) changes.config = config

    const saved = await update.mutateAsync(changes)
    form.reset(valuesFrom(saved))
    const buildChanged = Boolean(changes.config || changes.branch)
    notify.success("Settings saved", {
      description: buildChanged ? "Build and start settings apply from the next deployment." : undefined,
      action: buildChanged && latest.data ? { label: "Redeploy now", onClick: () => void startRedeploy(latest.data!) } : undefined,
    })
  }

  const deleteProject = async () => {
    const confirmed = await confirm({
      tone: "destructive",
      title: `Delete ${project.name}?`,
      description: `${project.url ? `${project.url} goes offline immediately. ` : ""}All of its deployments, logs and environment variables are deleted. This can't be undone.`,
      confirmText: project.name,
      confirmLabel: "Delete project",
      action: () => remove.mutateAsync(),
    })
    if (confirmed) {
      notify.success(`${project.name} was deleted`)
      router.replace("/dashboard/projects")
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="gap-6">
      <Section title="General">
        <SettingsTable>
          <SettingRow label="Project name" htmlFor="set-name" error={formState.errors.name?.message} aside={<NameStatus control={control} current={project.name} />}>
            <span className="flex min-w-0 flex-1 items-center">
              <input id="set-name" {...register("name")} aria-invalid={Boolean(formState.errors.name)} autoComplete="off" spellCheck={false} className={cn(settingInputClass, "rounded-r-none")} />
              <span className="surface-band flex h-8 items-center rounded-r-md px-2 font-mono text-[0.8125rem] text-muted-foreground">.{siteConfig.deployDomain}</span>
            </span>
          </SettingRow>
          <SettingRow label="Repository">
            <span className="flex items-center gap-2 px-2 font-mono text-[0.8125rem]">
              <Icon name="github" size="xs" className="text-muted-foreground" />
              {project.repository}
            </span>
          </SettingRow>
          <SettingRow label="Branch" error={formState.errors.branch?.message}>
            <BranchPicker control={control} repository={project.repository} />
          </SettingRow>
          <SettingRow label="Created">
            <span className="px-2 text-sm text-muted-foreground">{formatRelativeTime(project.createdAt)}</span>
          </SettingRow>
        </SettingsTable>
      </Section>

      <Section title="Build & start" description="Used from the next deployment. To change the runtime, deploy the repository as a new project.">
        <SettingsTable>
          <SettingRow label="Runtime">
            <span className="px-2 font-mono text-[0.8125rem] text-muted-foreground">{project.config.runtimeVersion}</span>
          </SettingRow>
          <SettingRow label="Build" htmlFor="set-build" error={formState.errors.buildCommand?.message}>
            <input id="set-build" {...register("buildCommand")} spellCheck={false} placeholder="nothing to build" className={settingInputClass} />
          </SettingRow>
          {isStatic ? (
            <SettingRow label="Serve">
              <span className="px-2 text-sm text-muted-foreground">Build output as static files — no start command or port.</span>
            </SettingRow>
          ) : (
            <>
              <SettingRow label="Start" htmlFor="set-start" error={formState.errors.startCommand?.message}>
                <input id="set-start" {...register("startCommand")} spellCheck={false} placeholder="npm start" className={settingInputClass} />
              </SettingRow>
              <SettingRow label="Port" htmlFor="set-port" error={formState.errors.port?.message}>
                <input id="set-port" {...register("port")} aria-invalid={Boolean(formState.errors.port)} inputMode="numeric" className={cn(settingInputClass, "max-w-28")} />
              </SettingRow>
            </>
          )}
          <SettingRow label="Root directory" htmlFor="set-root">
            <input id="set-root" {...register("rootDirectory")} spellCheck={false} placeholder="./" className={settingInputClass} />
          </SettingRow>
        </SettingsTable>
      </Section>

      <Section title="Danger zone">
        <div className="surface-raised flex flex-wrap items-center gap-4 rounded-xl border-destructive/30 px-4 py-3.5">
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="text-sm font-medium">Delete this project</p>
            <p className="text-xs text-muted-foreground">Takes it offline and deletes its deployments, logs and variables.</p>
          </div>
          <Button type="button" variant="destructive" onClick={deleteProject}>
            Delete project…
          </Button>
        </div>
      </Section>

      {formState.isDirty && (
        <div className="surface-sunken sticky bottom-3 z-10 grid animate-in gap-2 rounded-xl border border-border/60 px-4 py-3 duration-300 fade-in slide-in-from-bottom-2">
          <FormRootError />
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">Unsaved changes</p>
            <Button type="button" variant="ghost" onClick={() => form.reset(valuesFrom(project))} disabled={formState.isSubmitting}>
              Discard
            </Button>
            <Button type="submit" loading={formState.isSubmitting}>
              Save changes
            </Button>
          </div>
        </div>
      )}
      <UnsavedChangesGuard when={formState.isDirty && !formState.isSubmitting} />
    </Form>
  )
}

/** Project › Settings: name, branch, build & start, and deleting the project. */
export function ProjectSettings({ projectId }: { projectId: string }) {
  const query = useProject(projectId)
  return (
    <ProjectGate query={query}>
      {(project) => (
        <div className="grid max-w-3xl gap-4">
          <PageHeader title="Settings" description={`How ${project.name} is built, started and named.`} />
          <SettingsForm project={project} />
        </div>
      )}
    </ProjectGate>
  )
}
