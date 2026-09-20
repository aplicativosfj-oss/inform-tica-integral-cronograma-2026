import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-primary/40 bg-primary/80 text-primary-foreground shadow hover:bg-primary/90 hover:border-primary/60",
        secondary:
          "border-secondary/40 bg-secondary/70 text-secondary-foreground hover:bg-secondary/85 hover:border-secondary/60",
        destructive:
          "border-destructive/40 bg-destructive/80 text-destructive-foreground shadow hover:bg-destructive/90 hover:border-destructive/60",
        outline: "border-border/40 bg-white/30 dark:bg-card/50 text-foreground backdrop-blur-lg hover:bg-white/40 dark:hover:bg-card/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
