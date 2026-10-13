import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { AccentText } from "@/components/shared/accent-text";
import { Eyebrow } from "@/components/shared/eyebrow";
import { FadeInUp } from "@/components/shared/motion/fade-in-up";

const sectionHeaderVariants = cva("flex flex-col", {
  variants: {
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    },
  },
  defaultVariants: { align: "left" },
});

type SectionHeaderProps = VariantProps<typeof sectionHeaderVariants> & {
  eyebrow?: string;
  /** `*word*` renders in the brand ink. */
  title: string;
  description?: string;
  className?: string;
  /** Heading level — h2 for sections, h1 only when the header is the page's title. */
  as?: "h1" | "h2";
  children?: React.ReactNode;
};

/** Eyebrow + heading + description. The single section-header recipe for every page. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align,
  className,
  as: Heading = "h2",
  children,
}: SectionHeaderProps) {
  return (
    <FadeInUp className={cn(sectionHeaderVariants({ align }), className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <Heading className="max-w-7xl font-heading text-heading font-medium text-balance tracking-tight">
        <AccentText text={title} />
      </Heading>
      {description && (
        <p className="font-heading mt-4 max-w-2xl text-lead text-pretty text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </FadeInUp>
  );
}
