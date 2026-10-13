import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      default: "max-w-[1340px]",
      narrow: "max-w-3xl",
    },
  },
  defaultVariants: { size: "default" },
});

type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants>;

/** Max-width + gutter wrapper used by every section. */
export function Container({ className, size, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props} />
  );
}
