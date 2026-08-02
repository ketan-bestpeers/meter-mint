import React from 'react';
import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
}

export function Tag({ children, className, variant = 'default' }: TagProps) {
  const variantStyles = {
    default: 'bg-muted text-foreground border-border',
    primary: 'bg-blue-900/10 text-blue-800 border-blue-800/20 dark:bg-blue-900/10 dark:text-blue-300 dark:border-blue-700',
    success: 'bg-emerald-900/10 text-emerald-800 border-emerald-800/20 dark:bg-emerald-900/10 dark:text-emerald-300 dark:border-emerald-800/50',
    warning: 'bg-amber-900/10 text-amber-800 border-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:border-amber-800/50',
    error: 'bg-red-900/10 text-red-800 border-red-800/20 dark:bg-red-900/10 dark:text-red-300 dark:border-red-800/50',
    info: 'bg-blue-900/10 text-blue-800 border-blue-800/20 dark:bg-blue-900/10 dark:text-blue-300 dark:border-blue-800/50',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-bold text-xs shadow-none transition-all duration-200",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
