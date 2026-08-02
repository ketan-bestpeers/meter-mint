import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
  animate?: boolean;
}

export function ProgressBar({ value, color = '#514b82', className, animate = false }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const insetRight = 100 - clampedValue;

  return (
    <div
      className={cn(
        "loader-custom",
        animate && "loader-custom-animated",
        className
      )}
      style={{
        color: color,
        '--progress-inset': `${insetRight}%`,
      } as React.CSSProperties}
    />
  );
}
