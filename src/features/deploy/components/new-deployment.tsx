"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useWatch } from "react-hook-form"

import { runtimes } from "@/content/runtimes"
import { nameAvailabilityQuery, staticRuntimes, useBranches, useCreateProject, useDetection, useRepositories, type Repository } from "@/features/deploy/deploy"
import { newDeploymentDefaults, newDeploymentSchema, toProjectName, type NewDeploymentValues } from "@/features/deploy/components/schema"
import { RepoList } from "@/features/deploy/components/repo-list"
import { DeployConfig } from "@/features/deploy/components/deploy-config"
import { deploymentHref } from "@/features/deployments/components/use-deployment-actions"
import { notify } from "@/components/feedback"
import { Form, UnsavedChangesGuard, useFormDraft, useZodForm } from "@/components/forms"

/** A runtime's documented defaults, minus placeholders like "—" or "CMD from Dockerfile". */
function runtimeDefaults(runtimeId: string) {
  const runtime = runtimes.find((r) => r.id === runtimeId)
  const real = (value?: string) => (value && /^[a-z.]/i.test(value) && !value.startsWith("CMD") ? value : "")
  return { build: real(runtime?.buildCommand), start: real(runtime?.startCommand), port: /^\d+$/.test(runtime?.port ?? "") ? runtime!.port : "" }
}

function EmptyPane() {
  return (
    <div className="relative flex min-h-[28rem] flex-1 items-center justify-center overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 mask-fade-edges" />
      <div className="relative grid justify-items-center gap-2 text-center">
        <p className="text-sm font-medium">Choose a repository</p>
        <p className="max-w-64 text-sm text-muted-foreground">Its branch, detected runtime and settings open here, ready to deploy.</p>
        <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">↑ ↓ to move · Enter to open</p>
      </div>
    </div>
  )
}

/**
 * New deployment, as one screen: repositories on the left, the chosen one's deployment on the
 * right — facts, runtime, settings, environment — and Deploy. Detection pre-fills the runtime and
 * its commands without overwriting edits; the chosen repository is in the URL; a draft (minus
 * secret values) survives refreshes; leaving with unsaved input asks first.
 */
export function NewDeployment() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const form = useZodForm(newDeploymentSchema, { defaultValues: newDeploymentDefaults })
  const draft = useFormDraft(form, "new-deployment", {
    transform: (v) => ({ ...v, env: (v.env ?? []).map((row) => ({ ...row, value: "" })) }),
  })

  const values = useWatch({ control: form.control }) as NewDeploymentValues
  const { data: repositories } = useRepositories("")
  const repository = repositories?.find((r) => r.id === values.repositoryId)
  const branches = useBranches(values.repositoryId || undefined)
  const detection = useDetection(values.repositoryId || undefined, values.branch || undefined)
  const create = useCreateProject()

  // ── Choosing a repository ─────────────────────────────────────────────────────────
  const autoName = React.useRef("")
  const autoRuntime = React.useRef("")
  const lastFill = React.useRef<{ build: string; start: string; port: string } | null>(null)

  const choose = React.useCallback(
    (repo: Repository) => {
      if (repo.id === form.getValues("repositoryId")) return
      const name = form.getValues("name")
      const nextName = toProjectName(repo.fullName.split("/")[1] ?? repo.fullName)
      // A different repository starts fresh, except a name you typed yourself.
      form.reset(
        { ...newDeploymentDefaults, repositoryId: repo.id, branch: repo.defaultBranch, name: !name || name === autoName.current ? nextName : name },
        { keepDefaultValues: true }
      )
      autoName.current = nextName
      autoRuntime.current = ""
      lastFill.current = null
      router.replace(`${pathname}?repo=${repo.id}`, { scroll: false })
    },
    [form, pathname, router]
  )

  // Arriving with ?repo= (a shared link, a refresh without a draft).
  const fromUrl = searchParams.get("repo")
  React.useEffect(() => {
    if (!fromUrl || form.getValues("repositoryId")) return
    const repo = repositories?.find((r) => r.id === fromUrl)
    if (repo) choose(repo)
  }, [fromUrl, repositories, choose, form])

  // ── Pre-filling from detection, without clobbering edits ─────────────────────────
  React.useEffect(() => {
    const detected = detection.data?.runtime
    if (!detected) return
    const current = form.getValues("runtime")
    if (!current || current === autoRuntime.current) {
      autoRuntime.current = detected
      form.setValue("runtime", detected, { shouldDirty: true })
    }
  }, [detection.data, form])

  React.useEffect(() => {
    if (!values.runtime) return
    const { buildCommand, startCommand, port } = form.getValues()
    const untouched = lastFill.current
      ? buildCommand === lastFill.current.build && startCommand === lastFill.current.start && port === lastFill.current.port
      : !buildCommand && !startCommand && !port
    if (!untouched) return
    const d = detection.data
    const next = d && d.runtime === values.runtime ? { build: d.buildCommand ?? "", start: d.startCommand ?? "", port: d.port ? String(d.port) : "" } : runtimeDefaults(values.runtime)
    if (staticRuntimes.includes(values.runtime)) Object.assign(next, { start: "", port: "" })
    form.setValue("buildCommand", next.build, { shouldDirty: true })
    form.setValue("startCommand", next.start, { shouldDirty: true })
    form.setValue("port", next.port, { shouldDirty: true })
    lastFill.current = next
  }, [values.runtime, detection.data, form])

  // ── Deploying ─────────────────────────────────────────────────────────────────────
  const onSubmit = async (v: NewDeploymentValues) => {
    const isStatic = staticRuntimes.includes(v.runtime)
    const name = v.name.trim()
    const availability = await queryClient.fetchQuery(nameAvailabilityQuery(name)).catch(() => null)
    if (availability && !availability.available) {
      form.setError("name", { type: "server", message: `${name} is taken${availability.suggestion ? ` — try ${availability.suggestion}` : ""}.` }, { shouldFocus: true })
      return
    }
    const result = await create.mutateAsync({
      name,
      repositoryId: v.repositoryId,
      branch: v.branch,
      runtime: v.runtime,
      config: {
        buildCommand: v.buildCommand || null,
        startCommand: isStatic ? null : v.startCommand || null,
        port: isStatic ? null : Number(v.port),
        rootDirectory: v.rootDirectory || null,
      },
      env: (v.env ?? []).filter((row) => row.key),
    })
    draft.clear()
    form.reset(newDeploymentDefaults)
    notify.success(`Deploying ${result.project.name}`, { description: "It's building now — follow along live." })
    router.push(deploymentHref(result.deployment))
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[22rem_minmax(0,1fr)]">
      <RepoList selectedId={values.repositoryId} onSelect={choose} className="max-h-[26rem] lg:sticky lg:top-20 lg:max-h-[calc(100dvh-7rem)]" />

      <section aria-label="Deployment settings" className="flex min-h-[28rem] flex-col overflow-clip rounded-2xl border border-border/70 bg-card">
        {repository ? (
          <DeployConfig
            key={repository.id}
            repository={repository}
            branches={branches.data}
            branchesLoading={branches.isPending}
            detection={detection.data}
            detecting={detection.isFetching && !detection.data}
            submitting={form.formState.isSubmitting}
          />
        ) : (
          <EmptyPane />
        )}
      </section>
      <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitSuccessful} />
    </Form>
  )
}
