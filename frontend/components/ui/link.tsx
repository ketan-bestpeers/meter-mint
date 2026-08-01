import * as React from "react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { cn } from "@/lib/utils";

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>,
    NextLinkProps {
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, ...props }, ref) => {
    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn("font-semibold text-foreground hover:text-primary transition-colors duration-200", className)}
        {...props}
      />
    );
  }
);
Link.displayName = "Link";
