import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: { value: string; label: string }[];
  variant?: 'default' | 'primary';
}

export function Select({ options, value, onChange, className, variant = 'default', ...props }: SelectProps) {
  const baseStyle = "font-semibold border-px border-foreground rounded focus:outline-none cursor-pointer transition-all duration-200";
  const variants = {
    default: "bg-background text-foreground text-sm px-2.5 py-1",
    primary: "bg-primary text-white font-extrabold text-sm px-3 py-1 hover:bg-primary-hover",
  };

  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(baseStyle, variants[variant], className)}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-background text-foreground">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
