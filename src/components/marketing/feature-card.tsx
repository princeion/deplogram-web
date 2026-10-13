import { cn } from "@/lib/utils";
import type { FeatureItem } from "@/content/types";
import { Icon } from "@/components/shared/icon";
import { GradientStage, gradientFor } from "@/components/marketing/gradient-stage";
import { InlineText } from "@/components/marketing/inline-text";


/**
 * OpenAI-style feature card: a gradient stage with a white icon tile at its centre,
 * then title + description. `index` rotates the gradient so neighbouring cards differ.
 */
export function FeatureCard({
  item,
  index = 0,
  className,
}: {
  item: FeatureItem;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-2xl bg-card p-2.5 ring-1 ring-border/60",
        className,
      )}
    >
      <GradientStage
        {...gradientFor(index)}
        className="flex aspect-video items-center justify-center rounded-xl"
      >
        <span className="flex p-3 items-center justify-center rounded-lg bg-white text-neutral-950 transition-transform duration-500 ease-out-expo ">
          <Icon name={item.icon} className="sm:size-7" />
        </span>
      </GradientStage>
      <div className="flex flex-col gap-1.5 px-3.5 pt-5 pb-3.5">
        <h3 className="font-heading text-subheading font-medium">
          {item.title}
        </h3>
        <p className="text-sm text-pretty text-muted-foreground">
          <InlineText text={item.description} />
        </p>
      </div>
    </div>
  );
}
