export type Stat = {
  value: number
  suffix?: string
  label: string
}

/** Product facts only — no invented usage metrics. */
export const productStats: readonly Stat[] = [
  { value: 5, label: "Products, one account" },
  { value: 8, label: "Built-in APIs" },
  { value: 12, label: "Developer utilities" },
  { value: 8, label: "Runtimes supported" },
]
