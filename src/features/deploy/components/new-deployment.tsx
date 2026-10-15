"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useWatch } from "react-hook-form"

import { ApiError } from "@/lib/api-client"
import { runtimes } from "@/content/runtimes"
import { nameAvailabilityQuery, staticRuntimes, useBranches, useCreateProject, useDetection, useRepositories, type Repository } from "@/features/deploy/deploy"
import { newDeploymentDefaults, newDeploymentSchema, newDeploymentSteps, toProjectName, type NewDeploymentValues } from "@/features/deploy/components/schema"
import { SourceStep } from "@/features/deploy/components/source-step"
import { RuntimeStep } from "@/features/deploy/components/runtime-step"
import { ConfigureStep } from "@/features/deploy/components/configure-step"
import { ReviewStep } from "@/features/deploy/components/review-step"
import { DeployPreview } from "@/features/deploy/components/deploy-preview"
import { deploymentHref } from "@/features/deployments/components/use-deployment-actions"
import { useUsage } from "@/features/usage/usage"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { notify } from "@/components/feedback"
import { Form, FormRootError, UnsavedChangesGuard, WizardProgress, useFormDraft, useFormWizard, useZodForm } from "@/components/forms"

const headings: Record<string, string> = {
  source: "Import a repository",
  runtime: "Choose a runtime",
  configure: "Configure the project",
  review: "Review and deploy",
}

/** A runtime's documented defaults, minus placeholders like "—" or "CMD from Dockerfile". */
function runtimeDefaults(runtimeId: string) {
  const runtime = runtimes.find((r) => r.id === runtimeId)
  const real = (value?: string) => (value && /^[a-z.]/i.test(value) && !value.startsWith("CMD") ? value : "")
  return { build: real(runtime?.buildCommand), start: real(runtime?.startCommand), port: /^\d+$/.test(runtime?.port ?? "") ? runtime!.port : "" }
}

/**
 * New deployment: Source → Runtime → Configure → Review, then the new deployment's page, where
 * the build plays live. Detection pre-fills the runtime and its commands without overwriting
 * anything you've typed; the current step lives in the URL; a draft (minus secret values)
 * survives refreshes; leaving with unsaved input asks first.
 */
export function NewDeployment() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const form = useZodForm(newDeploymentSchema, { defaultValues: newDeploymentDefaults })
  const wizard = useFormWizard(form, newDeploymentSteps, {
    initialStepId: searchParams.get("step") ?? undefined,
    onStepChange: (id) => router.replace(`${pathname}?step=${id}`, { scroll: false }),
  })
  const draft = useFormDraft(form, "new-deployment", {
    // Secret values never go into browser storage; names do.
    transform: (v) => ({ ...v, env: (v.env ?? []).map((row) => ({ ...row, value: "" })) }),
  })

  const values = useWatch({ control: form.control }) as NewDeploymentValues
  const { data: repositories } = useRepositories("")
  const repository = repositories?.find((r) => r.id === values.repositoryId)
  const branches = useBranches(values.repositoryId || undefined)
  const branch = branches.data?.find((b) => b.name === values.branch)
  const detection = useDetection(values.repositoryId || undefined, values.branch || undefined)
  const create = useCreateProject()
  const { data: usage } = useUsage()
  const liveLimit = usage?.limits.find((l) => l.id === "active_deployments")
  const planFull = liveLimit ? liveLimit.used >= liveLimit.limit : false

  // A ?step= link (or a refresh) without a draft behind it starts from the beginning.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      if (!form.getValues("repositoryId") && wizard.step?.id !== "source") wizard.goTo("source")
    }, 0)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, after the draft restore
  }, [])

  // ── Pre-filling, without clobbering edits ────────────────────────────────────────
  const autoName = React.useRef("")
  const onRepositoryChange = (repo: Repository) => {
    const current = form.getValues("name")
    if (!current || current === autoName.current) {
      autoName.current = toProjectName(repo.fullName.split("/")[1] ?? repo.fullName)
      form.setValue("name", autoName.current, { shouldDirty: true })
    }
  }

  const autoRuntime = React.useRef("")
  React.useEffect(() => {
    const detected = detection.data?.runtime
    if (!detected) return
    const current = form.getValues("runtime")
    if (!current || current === autoRuntime.current) {
      autoRuntime.current = detected
      form.setValue("runtime", detected, { shouldDirty: true, shouldValidate: Boolean(form.formState.errors.runtime) })
    }
  }, [detection.data, form])

  // When the runtime changes, fill its commands — unless they've been edited since the last fill.
  const lastFill = React.useRef<{ build: string; start: string; port: string } | null>(null)
  React.useEffect(() => {
    if (!values.runtime) return
    const { buildCommand, startCommand, port } = form.getValues()
    const untouched = lastFill.current
      ? buildCommand === lastFill.current.build && startCommand === lastFill.current.start && port === lastFill.current.port
      : !buildCommand && !startCommand && !port
    if (!untouched) return
    const d = detection.data
    const next =
      d && d.runtime === values.runtime
        ? { build: d.buildCommand ?? "", start: d.startCommand ?? "", port: d.port ? String(d.port) : "" }
        : runtimeDefaults(values.runtime)
    if (staticRuntimes.includes(values.runtime)) Object.assign(next, { start: "", port: "" })
    form.setValue("buildCommand", next.build, { shouldDirty: true })
    form.setValue("startCommand", next.start, { shouldDirty: true })
    form.setValue("port", next.port, { shouldDirty: true })
    lastFill.current = next
  }, [values.runtime, detection.data, form])

  // ── Moving on ─────────────────────────────────────────────────────────────────────
  const [checking, setChecking] = React.useState(false)
  const next = async () => {
    if (wizard.step?.id === "configure") {
      const valid = await form.trigger(["name", "buildCommand", "startCommand", "port", "rootDirectory", "env"], { shouldFocus: true })
      if (!valid) return
      // The name must still be free — checked here, not just as you type.
      setChecking(true)
      try {
        const name = form.getValues("name").trim()
        const result = await queryClient.fetchQuery(nameAvailabilityQuery(name))
        if (!result.available) {
          form.setError("name", { type: "server", message: `${name} is taken${result.suggestion ? ` — try ${result.suggestion}` : ""}.` }, { shouldFocus: true })
          return
        }
      } catch {
        // Can't check right now: let the server decide on deploy.
      } finally {
        setChecking(false)
      }
    }
    await wizard.next()
  }

  const onSubmit = async (v: NewDeploymentValues) => {
    const isStatic = staticRuntimes.includes(v.runtime)
    try {
      const result = await create.mutateAsync({
        name: v.name.trim(),
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
    } catch (error) {
      // A field error from the server belongs on its step — take people there.
      const fields = error instanceof ApiError ? (error.body as { error?: { fields?: Record<string, string> } })?.error?.fields : undefined
      if (fields?.name) wizard.goTo("configure")
      throw error
    }
  }

  const step = wizard.step?.id ?? "source"

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Form
        form={form}
        onSubmit={onSubmit}
        onKeyDown={(event) => {
          // Enter moves to the next step rather than submitting early.
          if (event.key === "Enter" && !wizard.isLast && (event.target as HTMLElement).tagName === "INPUT") {
            event.preventDefault()
            void next()
          }
        }}
        className="gap-5"
      >
        <WizardProgress steps={wizard.steps} onSelect={wizard.goTo} />
        {draft.restored && step === "source" && (
          <p className="-mt-1 text-xs text-muted-foreground">Picked up where you left off. Secret values aren&apos;t saved, so re-enter those.</p>
        )}

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <header className="grid gap-1 border-b border-border/60 px-5 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground tabular-nums">
              Step {wizard.index + 1} of {wizard.count}
            </p>
            <h2 className="text-lg font-medium tracking-tight">{headings[step]}</h2>
            {wizard.step?.description && <p className="text-sm text-muted-foreground">{wizard.step.description}</p>}
          </header>

          <div key={step} className="animate-in px-5 py-5 duration-300 fade-in slide-in-from-right-2 ease-out-expo sm:px-6 sm:py-6 motion-reduce:animate-none">
            {step === "source" && <SourceStep onRepositoryChange={onRepositoryChange} />}
            {step === "runtime" && (
              <RuntimeStep
                target={`${repository?.fullName ?? "repository"}@${values.branch}`}
                detection={detection.data}
                detecting={detection.isFetching && !detection.data}
                detectionFailed={Boolean(detection.error)}
              />
            )}
            {step === "configure" && <ConfigureStep detection={detection.data} />}
            {step === "review" && <ReviewStep repository={repository} branch={branch} onEdit={wizard.goTo} />}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/20 px-5 py-3.5 sm:px-6">
            <Button type="button" variant="ghost" onClick={wizard.back} disabled={wizard.isFirst || form.formState.isSubmitting}>
              <Icon name="arrow-left" />
              Back
            </Button>
            {wizard.isLast ? (
              <Button type="submit" loading={form.formState.isSubmitting} disabled={planFull}>
                <Icon name="rocket" />
                Deploy
              </Button>
            ) : (
              <Button type="button" onClick={() => void next()} loading={checking}>
                Continue
                <Icon name="arrow-right" />
              </Button>
            )}
          </footer>
        </section>
        <FormRootError />
        <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitSuccessful} />
      </Form>

      <aside className="lg:sticky lg:top-20" aria-label="Deployment preview">
        <DeployPreview values={values} repository={repository} step={step} />
      </aside>
    </div>
  )
}
