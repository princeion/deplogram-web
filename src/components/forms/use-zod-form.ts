"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldValues, type Resolver, type UseFormProps } from "react-hook-form"
import type { z } from "zod"

/**
 * A react-hook-form instance validated by a Zod schema — the one way to start a form.
 *
 *   const form = useZodForm(profileSchema, { defaultValues: { name: "" } })
 *
 * Validation runs when a field is first left, then on every change ("onTouched"), so people
 * aren't scolded mid-typing but see fixes confirmed immediately.
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, "resolver">
) {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    // The resolver's generics are looser than the schema's; the schema is the source of truth.
    resolver: zodResolver(schema) as unknown as Resolver<z.input<TSchema>, unknown, z.output<TSchema>>,
    mode: "onTouched",
    ...options,
  })
}
