'use client';

import React from 'react';
import { Terminal } from 'lucide-react';
import { CodeConsole } from '@/components/ui/code-console';

interface ExecutionLogsProps {
  logs: string[];
  onClear: () => void;
}

export function ExecutionLogs({ logs, onClear }: ExecutionLogsProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-foreground font-mono text-xs font-bold px-1">
        <Terminal className="text-primary animate-pulse" size={18} />
        <span>Console Execution Logs (Dev Stream)</span>
      </div>
      <CodeConsole
        logs={logs}
        onClear={onClear}
        maxHeight="max-h-48"
        className="border-2 border-foreground"
      />
    </section>
  );
}
