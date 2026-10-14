import { QueryClient, isServer } from "@tanstack/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR prefetching, refetching immediately after hydration is wasted work.
        staleTime: 60_000,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * A new client per request on the server (no data shared between users), one per tab in the
 * browser (so React suspending during the first render doesn't throw the cache away).
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  return (browserQueryClient ??= makeQueryClient())
}
