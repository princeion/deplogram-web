"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { staticRuntimes, useNameAvailability, type Detection } from "@/features/deploy/deploy"
import { projectNameSchema, type NewDeploymentValues } from "@/features/deploy/components/schema"
import { Icon } from "@/components/shared/icon"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/feedback"
import { KeyValueField, TextField } from "@/components/forms"

export function useDebouncedValue<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

/** Under the name field: is it free, and what its URL will be. Offers a free alternative when taken. */
function NameAvailability() {
  const { control, setValue } = useFormContext<NewDeploymentValues>()
  const name = useWatch({ control, name: "name" })?.trim() ?? ""
  const debounced = useDebouncedValue(name)
  const valid = projectNameSchema.safeParse(debounced).success
  const { data, isFetching } = useNameAvailability(valid ? debounced : "")

  if (!name || !valid) return null
  if (isFetching || debounced !== name)
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        <Spinner className="size-3" /> Checking {name}.dpl.app…
      </p>
    )
  if (!data) return null
  return data.available ? (
    <p className="flex items-center gap-1.5 text-xs text-success" aria-live="polite">
      <Icon name="check" size="xs" />
      <span className="font-mono">{data.url}</span> is available
    </p>
  ) : (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-destructive" aria-live="polite">
      <Icon name="circle-x" size="xs" />
      {name} is taken.
      {data.suggestion && (
        <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setValue("name", data.suggestion!, { shouldDirty: true, shouldValidate: true })}>
          Use {data.suggestion}
        </Button>
      )}
    </p>
  )
}

/** Variable names from the repo's .env.example that aren't in the list yet, as one-click adds. */
function EnvSuggestions({ names }: { names: readonly string[] }) {
  const { control, setValue, getValues } = useFormContext<NewDeploymentValues>()
  const env = useWatch({ control, name: "env" }) ?? []
  const missing = names.filter((name) => !env.some((row) => row?.key === name))
  if (missing.length === 0) return null
  const add = (keys: readonly string[]) => {
    const current = (getValues("env") ?? []).filter((row) => row.key || row.value)
    setValue("env", [...current, ...keys.map((key) => ({ key, value: "" }))], { shouldDirty: true })
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/80 px-3 py-2.5 text-xs">
      <span className="text-muted-foreground">Found in .env.example:</span>
      {missing.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => add([name])}
          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/40 px-1.5 py-0.5 font-mono text-[0.7rem] transition-colors hover:border-foreground/40 hover:bg-muted"
        >
          <Icon name="plus" size="xs" />
          {name}
        </button>
      ))}
      {missing.length > 1 && (
        <Button type="button" variant="ghost" size="xs" onClick={() => add(missing)} className="ml-auto">
          Add all
        </Button>
      )}
    </div>
  )
}

/** Step 3 — name, build and start settings, environment. Static runtimes have no start command or port. */
export function ConfigureStep({ detection }: { detection?: Detection }) {
  const { control } = useFormContext<NewDeploymentValues>()
  const runtime = useWatch({ control, name: "runtime" })
  const isStatic = staticRuntimes.includes(runtime)

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <TextField control={control} name="name" label="Project name" required mono autoComplete="off" description="Also your URL: name.dpl.app. Lowercase letters, numbers and hyphens." />
        <NameAvailability />
      </div>

      <fieldset className="grid gap-5">
        <legend className="mb-3 text-sm font-medium">Build &amp; start</legend>
        {isStatic && (
          <Callout title="Served as static files" className="mb-1">
            The build output is published and served directly — there&apos;s no start command or port.
          </Callout>
        )}
        <div className={cn("grid gap-5", !isStatic && "sm:grid-cols-2")}>
          <TextField control={control} name="buildCommand" label="Build command" mono placeholder="npm run build" description="Leave empty if there's nothing to build." />
          {!isStatic && (
            <TextField
              control={control}
              name="startCommand"
              label="Start command"
              required={runtime !== "docker"}
              mono
              placeholder={runtime === "docker" ? "CMD from your Dockerfile" : "npm start"}
            />
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {!isStatic && <TextField control={control} name="port" label="Port" required mono inputMode="numeric" placeholder="3000" description="The port your app listens on." />}
          <TextField control={control} name="rootDirectory" label="Root directory" mono placeholder="./" description="Only if the app isn't at the repository root." />
        </div>
      </fieldset>

      <div className="grid gap-3">
        {detection && detection.envExample.length > 0 && <EnvSuggestions names={detection.envExample} />}
        <KeyValueField<NewDeploymentValues>
          name="env"
          description="Paste a whole .env into a name box to add many at once. Values are encrypted and never shown again in full."
        />
      </div>
    </div>
  )
}
