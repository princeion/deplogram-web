import { z } from "zod"

import { envVarsSchema } from "@/components/forms"
import type { WizardStep } from "@/components/forms"
import { staticRuntimes } from "@/features/deploy/deploy"

/** Project names become hosts (`name.dpl.app`): lowercase, digits, hyphens; 3–40 characters. */
export const projectNameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(40, "40 characters at most")
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Lowercase letters, numbers and hyphens — start and end with a letter or number")

/** Turns a repository name into a valid project name: "My_App.v2" → "my-app-v2". */
export const toProjectName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)

export const newDeploymentSchema = z
  .object({
    repositoryId: z.string().min(1, "Choose a repository"),
    branch: z.string().min(1, "Choose a branch"),
    runtime: z.string().min(1, "Pick a runtime"),
    name: projectNameSchema,
    buildCommand: z.string().trim(),
    startCommand: z.string().trim(),
    /** Kept as text in the form; checked and converted on submit. */
    port: z.string().trim(),
    rootDirectory: z.string().trim(),
    env: envVarsSchema,
  })
  .superRefine((values, ctx) => {
    if (staticRuntimes.includes(values.runtime)) return
    // Docker images may define their own start command (CMD); everything else needs one.
    if (values.runtime !== "docker" && !values.startCommand) ctx.addIssue({ code: "custom", path: ["startCommand"], message: "Enter the command that starts your app" })
    const port = Number(values.port)
    if (!values.port || !Number.isInteger(port) || port < 1 || port > 65535) ctx.addIssue({ code: "custom", path: ["port"], message: "Enter the port your app listens on (1–65535)" })
  })

export type NewDeploymentValues = z.input<typeof newDeploymentSchema>

export const newDeploymentDefaults: NewDeploymentValues = {
  repositoryId: "",
  branch: "",
  runtime: "",
  name: "",
  buildCommand: "",
  startCommand: "",
  port: "",
  rootDirectory: "",
  env: [],
}

export const newDeploymentSteps: WizardStep<NewDeploymentValues>[] = [
  { id: "source", title: "Source", description: "Choose the repository and branch to deploy.", fields: ["repositoryId", "branch"] },
  { id: "runtime", title: "Runtime", description: "We looked at the code to suggest one. Change it if we got it wrong.", fields: ["runtime"] },
  { id: "configure", title: "Configure", description: "Name the project and check how it builds and starts.", fields: ["name", "buildCommand", "startCommand", "port", "rootDirectory", "env"] },
  { id: "review", title: "Review", description: "Check everything, then deploy." },
]
