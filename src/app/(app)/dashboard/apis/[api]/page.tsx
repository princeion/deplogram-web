import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { apiCatalog, apiIds, type ApiId } from "@/features/apis/apis"
import { ApiDetail } from "@/features/apis/components/api-detail"
import { Page, PageHeader } from "@/components/app-shell/page"

const isApiId = (value: string): value is ApiId => (apiIds as readonly string[]).includes(value)

export function generateStaticParams() {
  return apiIds.map((api) => ({ api }))
}

export async function generateMetadata({ params }: PageProps<"/dashboard/apis/[api]">): Promise<Metadata> {
  const { api } = await params
  return { title: isApiId(api) ? apiCatalog[api].name : "APIs" }
}

export default async function ApiPage({ params }: PageProps<"/dashboard/apis/[api]">) {
  const { api } = await params
  if (!isApiId(api)) notFound()
  const info = apiCatalog[api]
  return (
    <Page width="wide">
      <PageHeader title={info.name} description={info.description} />
      <ApiDetail api={api} />
    </Page>
  )
}
