import React from 'react';
import { cn } from '@/lib/utils';

interface CodeConsoleProps {
  logs: string[];
  title?: string;
  onClear?: () => void;
  maxHeight?: string;
  className?: string;
}

export function CodeConsole({
  logs,
  title,
  onClear,
  maxHeight = "max-h-36",
  className,
}: CodeConsoleProps) {
  return (
    <div className={cn("bg-slate-950 text-slate-100 border-2 border-foreground dark:border-border p-4 rounded font-mono text-[10px] shadow-none flex flex-col gap-2.5", className)}>
      {(title || onClear) && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1.5">
          {title && <span className="font-bold text-slate-300">{title}</span>}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="hover:underline text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
      <div className={cn("flex flex-col gap-1.5 overflow-y-auto text-emerald-400", maxHeight)}>
        {logs.length === 0 ? (
          <p className="text-slate-500 italic">No logs available</p>
        ) : (
          logs.map((log, index) => (
            <p key={index} className="leading-relaxed whitespace-pre-wrap">
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
