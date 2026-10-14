/** Recently chosen command ids, newest first — per browser, best effort (storage may be blocked). */
const KEY = "deplogram:palette-recent"
const MAX = 5

export function readRecent(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

export function pushRecent(id: string) {
  try {
    const next = [id, ...readRecent().filter((existing) => existing !== id)].slice(0, MAX)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private mode / blocked storage: recents just won't persist.
  }
}
