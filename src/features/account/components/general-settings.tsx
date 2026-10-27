"use client"

import Link from "next/link"
import { toast } from "sonner"

import { runtimes } from "@/content/runtimes"
import {
  generalSettingsFormSchema,
  toGeneralSettingsForm,
  useAccountSettings,
  useUpdateAccountSettings,
  type AccountSettings,
} from "@/features/account/account"
import { Form, FormActions, FormRootError, SelectField, TextField, UnsavedChangesGuard, useZodForm } from "@/components/forms"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"
import { PageSection } from "@/components/app-shell/page"

const runtimeOptions = runtimes.map((runtime) => ({ value: runtime.id, label: runtime.name, icon: runtime.icon }))

function GeneralSettingsForm({ settings }: { settings: AccountSettings }) {
  const form = useZodForm(generalSettingsFormSchema, { defaultValues: toGeneralSettingsForm(settings) })
  const update = useUpdateAccountSettings()

  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        const saved = await update.mutateAsync(values)
        form.reset(toGeneralSettingsForm(saved))
        toast.success("Settings saved")
      }}
    >
      <PageSection title="Profile" description="How you appear in Your Galley." variant="card">
        <div className="grid gap-5">
          <TextField control={form.control} name="name" label="Name" required autoComplete="name" maxLength={64} />
          <Field>
            <FieldLabel htmlFor="account-email">Email</FieldLabel>
            <Input id="account-email" value={settings.email} readOnly aria-describedby="account-email-hint" className="text-muted-foreground" />
            <FieldDescription id="account-email-hint">Managed by your sign-in provider.</FieldDescription>
          </Field>
        </div>
      </PageSection>

      <PageSection title="Preferences" variant="card">
        <div className="grid gap-5">
          <SelectField
            control={form.control}
            name="defaultRuntime"
            label="Default runtime"
            description="Pre-selected when you start a new deployment."
            options={runtimeOptions}
          />
          <p className="text-sm text-muted-foreground">
            Which emails you get —{" "}
            <Link href="/dashboard/settings/notifications" className="text-foreground underline-offset-2 hover:underline">
              Notifications
            </Link>
            .
          </p>
        </div>
      </PageSection>

      <FormRootError />
      <FormActions sticky />
      <UnsavedChangesGuard when={form.formState.isDirty} />
    </Form>
  )
}

/** Account settings → General: profile and preferences. */
export function GeneralSettings() {
  const { data, isPending, isError, refetch, isRefetching } = useAccountSettings()

  if (isPending) {
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }
  if (isError) return <ErrorState title="Settings didn't load." onRetry={() => refetch()} retrying={isRefetching} />
  return <GeneralSettingsForm settings={data} />
}
