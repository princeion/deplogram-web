import type { Metadata } from "next"

import { PadWorkspace } from "@/features/codepad/components/pad-workspace"

export const metadata: Metadata = { title: "CodePad" }

export default async function PadPage({ params }: PageProps<"/dashboard/codepad/[padId]">) {
  const { padId } = await params
  return <PadWorkspace padId={padId} />
}
