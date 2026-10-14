"use client"

import { useRouter } from "next/navigation"

import { useDeleteAccount } from "@/features/account/account"
import { useViewer } from "@/features/auth/session"
import { useProjects } from "@/features/projects/projects"
import { Callout, notify, useConfirm } from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const consequences = [
  "Every project is taken offline and its deployments are removed.",
  "Files in Storage are deleted.",
  "API keys stop working straight away.",
  "Your sign-in is removed. You can sign up again later, but nothing comes back.",
]

/** Settings › Delete account: what's lost, then a type-your-email confirmation. */
export function DeleteAccount() {
  const router = useRouter()
  const confirm = useConfirm()
  const { data: viewer, isPending } = useViewer()
  const { data: projects } = useProjects()
  const deleteAccount = useDeleteAccount()

  const start = async () => {
    if (!viewer) return
    const projectCount = projects?.length ?? 0
    const confirmed = await confirm({
      tone: "destructive",
      title: "Delete your account?",
      description: `This can't be undone. ${projectCount === 1 ? "Your project goes" : `All ${projectCount} of your projects go`} offline immediately and everything in your Galley is deleted.`,
      confirmText: viewer.email,
      confirmLabel: "Delete account",
      action: () => deleteAccount.mutateAsync(),
    })
    if (confirmed) {
      notify.success("Your account has been deleted", { description: "Thanks for trying Deplogram." })
      router.replace("/")
    }
  }

  return (
    <div className="grid gap-6">
      <Callout tone="danger" title="Deleting your account is permanent">
        <ul className="mt-1 grid list-disc gap-1 pl-4">
          {consequences.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Callout>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="grid gap-1">
          <p className="text-sm font-medium">Delete this account</p>
          {isPending ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{viewer?.email}</span>
            </p>
          )}
        </div>
        <Button variant="destructive" disabled={!viewer} onClick={start}>
          Delete account…
        </Button>
      </div>
    </div>
  )
}
