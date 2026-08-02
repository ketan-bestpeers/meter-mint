import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg p-8 transition-all duration-200 shadow-none border-0 font-sans",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        muted: "bg-muted text-foreground",
        blue: "bg-blue-50 text-foreground hover:bg-blue-100",
        emerald: "bg-emerald-50 text-foreground hover:bg-emerald-100",
        amber: "bg-amber-50 text-foreground hover:bg-amber-100",
        dark: "bg-foreground text-white",
        darkSlate: "bg-[#1e293b] text-white border-2 border-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  isLink?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, isLink, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, className }),
          isLink && "cursor-pointer group hover:scale-[1.02]"
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
