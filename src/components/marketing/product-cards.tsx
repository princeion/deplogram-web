import type * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger";
import { GradientStage, gradientFor, type GradientSource } from "@/components/marketing/gradient-stage";
import {
  ApiIllustration,
  CodePadIllustration,
  DeployIllustration,
  RuntimesIllustration,
  StorageIllustration,
} from "@/components/marketing/product-illustrations";

const illustrations = {
  deploy: DeployIllustration,
  runtimes: RuntimesIllustration,
  codepad: CodePadIllustration,
  storage: StorageIllustration,
  apis: ApiIllustration,
} as const;

export type ProductCardItem = {
  title: string;
  href: string;
  cta: string;
  illustration: keyof typeof illustrations;
};


/**
 * Codex-style product cards: a dark card holding a gradient stage with an animated illustration,
 * then a large title and a full-width white button.
 */
export function ProductCards({
  items,
  className,
}: {
  items: readonly ProductCardItem[];
  className?: string;
}) {
  return (
    <StaggerGroup
      as="ul"
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        items.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, i) => {
        const Illustration = illustrations[item.illustration];
        return (
          <StaggerItem
            as="li"
            key={item.href}
            className="flex flex-col rounded-2xl bg-card p-2.5 ring-1 ring-border/60"
          >
            <GradientStage
              {...gradientFor(i)}
              className="flex aspect-[4/3.3] items-center rounded-xl p-5"
            >
              <Illustration />
            </GradientStage>
            <div className="flex flex-1 flex-col gap-8 px-3.5 pt-6 pb-3.5">
              <h3 className="font-heading text-2xl font-medium tracking-tight">
                {item.title}
              </h3>
              <Link
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "inverted", size: "lg" }),
                  "group mt-auto h-11 w-full text-base",
                )}
              >
                {item.cta}
                <Icon
                  name="arrow-up-right"
                  className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}

/** A gradient stage holding one larger product view — under simple heroes and in showcase sections. */
export function ProductStage({
  children,
  variant = "a",
  source = "ember",
  className,
}: {
  children: React.ReactNode;
  variant?: "a" | "b" | "c" | "d";
  source?: GradientSource;
  className?: string;
}) {
  return (
    <GradientStage
      variant={variant}
      source={source}
      className={cn(
        "flex items-center justify-center px-3 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-20",
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </GradientStage>
  );
}
