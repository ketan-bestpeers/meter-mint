'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="bg-card text-foreground border-t-4 border-foreground py-10 px-6 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-md border border-foreground text-white font-extrabold text-lg">
            M
          </div>
          <span className="font-extrabold text-lg tracking-tight">MeterMint Dashboard Console</span>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} MeterMint, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
