"use client"

import { toast } from "sonner"
import { z } from "zod"

import { runtimes } from "@/content/runtimes"
import {
  CheckboxField,
  envVarsSchema,
  Form,
  FormRootError,
  KeyValueField,
  RadioCardsField,
  SecretField,
  SelectField,
  TextField,
  UnsavedChangesGuard,
  useFormDraft,
  useFormWizard,
  useZodForm,
  WizardProgress,
  type WizardStep,
} from "@/components/forms"
import { Button } from "@/components/ui/button"
import { PageSection } from "@/components/app-shell/page"

const runtimeIds = runtimes.map((r) => r.id) as [string, ...string[]]

const schema = z
  .object({
    repository: z.string().min(1, "Choose a repository"),
    branch: z.string().min(1, "Choose a branch"),
    runtime: z.enum(runtimeIds, { message: "Pick a runtime" }),
    dockerfilePath: z.string().optional(),
    projectName: z
      .string()
      .trim()
      .min(1, "Name your project")
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens"),
    buildCommand: z.string().optional(),
    startCommand: z.string().min(1, "Enter a start command"),
    port: z.coerce.number({ message: "Enter a port" }).int().min(1, "1–65535").max(65535, "1–65535"),
    env: envVarsSchema,
    registryToken: z.string().optional(),
    acknowledge: z.literal(true, { message: "Confirm to deploy" }),
  })
  .superRefine((values, ctx) => {
    if (values.runtime === "docker" && !values.dockerfilePath?.trim()) {
      ctx.addIssue({ code: "custom", path: ["dockerfilePath"], message: "Enter the Dockerfile path" })
    }
  })

type Values = z.input<typeof schema>

const steps: WizardStep<Values>[] = [
  { id: "source", title: "Source", fields: ["repository", "branch"] },
  { id: "runtime", title: "Runtime", fields: ["runtime"] },
  // Only for Docker — a conditional step.
  { id: "docker", title: "Docker", fields: ["dockerfilePath"], when: (v) => v.runtime === "docker" },
  { id: "configure", title: "Configure", fields: ["projectName", "buildCommand", "startCommand", "port", "env", "registryToken"] },
  { id: "review", title: "Review", fields: ["acknowledge"] },
]

const repositories = ["ada/orders-api", "ada/admin-dashboard", "ada/docs-site"].map((value) => ({ value, label: value, icon: "git-branch" as const }))
const branches = ["main", "develop", "gh-pages"].map((value) => ({ value, label: value }))
const runtimeOptions = runtimes.map((r) => ({ value: r.id, label: r.name, description: r.detail, icon: r.icon }))

const defaults = {
  repository: "",
  branch: "main",
  runtime: "",
  dockerfilePath: "Dockerfile",
  projectName: "",
  buildCommand: "npm run build",
  startCommand: "npm start",
  port: 3000,
  env: [],
  registryToken: "",
  acknowledge: false,
} as unknown as Values

export function FormsPlayground() {
  const form = useZodForm(schema, { defaultValues: defaults })
  const wizard = useFormWizard(form, steps)
  // Survives refreshes; secret values are never written to storage.
  const draft = useFormDraft(form, "dev-new-deployment", {
    transform: (v) => ({ ...v, registryToken: "", env: (v.env ?? []).map((e) => ({ ...e, value: "" })) }),
  })

  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 900))
        draft.clear()
        form.reset(defaults)
        toast.success(`Deployed ${values.projectName} (pretend)`)
      }}
      onKeyDown={(event) => {
        // Enter moves to the next step instead of submitting early.
        if (event.key === "Enter" && !wizard.isLast && (event.target as HTMLElement).tagName === "INPUT") {
          event.preventDefault()
          void wizard.next()
        }
      }}
    >
      <WizardProgress steps={wizard.steps} onSelect={wizard.goTo} />
      {draft.restored && <p className="text-sm text-muted-foreground">Restored your unsaved draft.</p>}

      <PageSection title={wizard.step?.title} variant="card">
        <div className="grid gap-5">
          {wizard.step?.id === "source" && (
            <>
              <SelectField control={form.control} name="repository" label="Repository" required options={repositories} placeholder="Choose a repository" />
              <SelectField control={form.control} name="branch" label="Branch" required options={branches} />
            </>
          )}
          {wizard.step?.id === "runtime" && <RadioCardsField control={form.control} name="runtime" label="Runtime" required options={runtimeOptions} columns={2} />}
          {wizard.step?.id === "docker" && (
            <TextField control={form.control} name="dockerfilePath" label="Dockerfile path" required mono description="Relative to the repository root." />
          )}
          {wizard.step?.id === "configure" && (
            <>
              <TextField control={form.control} name="projectName" label="Project name" required mono description="Used in your deployment URL." />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField control={form.control} name="buildCommand" label="Build command" mono />
                <TextField control={form.control} name="startCommand" label="Start command" required mono />
              </div>
              <TextField control={form.control} name="port" label="Port" type="number" inputMode="numeric" required mono className="sm:max-w-40" />
              <KeyValueField<Values> name="env" />
              <SecretField control={form.control} name="registryToken" label="Registry token" description="Optional. Stored encrypted; never shown again after saving." />
            </>
          )}
          {wizard.step?.id === "review" && (
            <>
              <dl className="grid gap-2 text-sm">
                {(["repository", "branch", "runtime", "projectName", "startCommand", "port"] as const).map((key) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-mono text-xs">{String(form.getValues(key) ?? "—")}</dd>
                  </div>
                ))}
              </dl>
              <CheckboxField control={form.control} name="acknowledge" label="On the Free plan, up to 2 deployments can be live at once." />
            </>
          )}
        </div>
      </PageSection>

      <FormRootError />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={wizard.back} disabled={wizard.isFirst}>
          Back
        </Button>
        {wizard.isLast ? (
          <Button type="submit" variant="inverted" loading={form.formState.isSubmitting}>
            Deploy
          </Button>
        ) : (
          <Button type="button" variant="inverted" onClick={() => void wizard.next()}>
            Continue
          </Button>
        )}
      </div>
      <UnsavedChangesGuard when={form.formState.isDirty} />
    </Form>
  )
}
