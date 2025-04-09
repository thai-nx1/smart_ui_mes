import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary/10 text-secondary",
        destructive: "bg-destructive/10 text-destructive",
        outline: "text-foreground border border-input",
        text: "bg-blue-100 text-blue-800",
        paragraph: "bg-purple-100 text-purple-800",
        number: "bg-green-100 text-green-800",
        singleChoice: "bg-yellow-100 text-yellow-800",
        multiChoice: "bg-pink-100 text-pink-800",
        date: "bg-indigo-100 text-indigo-800",
        status: {
          active: "bg-green-100 text-green-800",
          inactive: "bg-gray-100 text-gray-800",
        }
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
