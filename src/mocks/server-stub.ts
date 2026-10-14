/**
 * Server stand-in for "msw/browser", which has no server build. Turbopack compiles client
 * components for SSR too, so the import must resolve there — but the worker is only ever started in
 * the browser (src/mocks/msw-provider.tsx), so this is never called. Wired in next.config.ts.
 */
export function setupWorker(): never {
  throw new Error("msw/browser is browser-only")
}
