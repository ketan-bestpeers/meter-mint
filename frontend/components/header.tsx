'use client';

import React from 'react';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TenantKeyOption, TenantInfo } from '@/lib/tenant-context';

interface HeaderProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  availableKeys: TenantKeyOption[];
  theme: 'flat' | 'dark';
  setTheme: (theme: 'flat' | 'dark') => void;
  tenantInfo: TenantInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  periods: { name: string; start: string; end: string }[];
  selectedPeriod: { name: string; start: string; end: string };
  onPeriodChange: (period: { name: string; start: string; end: string }) => void;
  onAddTenantClick: () => void;
}

export function Header({
  apiKey,
  setApiKey,
  availableKeys,
  theme,
  setTheme,
  tenantInfo,
  loading,
  error,
  refresh,
  periods,
  selectedPeriod,
  onPeriodChange,
  onAddTenantClick,
}: HeaderProps) {
  const getPeriodDisplayName = (name: string) => {
    if (name.includes('(Current)')) return name;
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const periodOptions = periods.map(p => ({
    value: p.name,
    label: getPeriodDisplayName(p.name),
  }));

  const keyOptions = availableKeys.map(opt => ({
    value: opt.apiKey,
    label: opt.name,
  }));

  return (
    <header className="border-b-2 border-foreground bg-card sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-md border-2 border-foreground text-white font-extrabold text-xl shadow-[3px_3px_0px_#000] dark:shadow-none">
            M
          </div>
          <span className="font-extrabold text-2xl tracking-tight">
            MeterMint
          </span>
          <span className="hidden sm:inline-block font-mono text-xs bg-muted px-2.5 py-1 rounded border border-border">
            Console v1.0
          </span>
        </div>

        {/* Connection & Plan & Controls (Responsive Desktop Nav) */}
        <div className="hidden lg:flex items-center gap-6">

          {/* Connection Status */}
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
            <span className={`h-2.5 w-2.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500 animate-ping'} inline-block`} />
            <span className="text-xs font-bold font-mono">
              {loading ? 'SYNCING' : error ? 'OFFLINE' : 'CONNECTED'}
            </span>
          </div>

          {/* Active Plan Badge */}
          {tenantInfo && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-foreground font-bold text-xs shadow-[2px_2px_0px_#000] dark:shadow-none ${tenantInfo.plan.name === 'Pro'
              ? 'bg-amber-100 text-amber-800 border-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
              : 'bg-blue-100 text-blue-800 border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
              }`}>
              <span>{tenantInfo.plan.name.toUpperCase()} PLAN</span>
            </div>
          )}

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase font-mono">Period:</span>
            <Select
              options={periodOptions}
              value={selectedPeriod.name}
              onChange={(e) => {
                const p = periods.find(x => x.name === e.target.value);
                if (p) onPeriodChange(p);
              }}
            />
          </div>

          {/* Tenant Switcher Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase font-mono">API Key:</span>
            <Select
              variant="primary"
              options={keyOptions}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              onClick={onAddTenantClick}
              variant={"outline"}
              size={'sm'}
            >
              + Add Tenant
            </Button>
          </div>

          {/* Theme Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'flat' ? 'dark' : 'flat')}
            className="h-10 w-10 p-0 flex items-center justify-center border-2 border-foreground rounded"
            title="Toggle Theme"
          >
            {theme === 'flat' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </div>

        {/* Refresh button for general status */}
        <div className="lg:hidden flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'flat' ? 'dark' : 'flat')}
            className="h-10 w-10 p-0 border-2 border-foreground"
          >
            {theme === 'flat' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
            className="border-2 border-foreground"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Mobile controls bar */}
      <div className="lg:hidden flex flex-col gap-2.5 px-6 pb-4 border-t border-border bg-card/95 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          {/* Status & Plan */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500'} inline-block`} />
            <span className="text-xs font-bold font-mono">
              {loading ? 'SYNCING' : error ? 'OFFLINE' : 'CONNECTED'}
            </span>
          </div>
          {tenantInfo && (
            <span className={`px-2.5 py-0.5 rounded-full border border-foreground font-bold text-xs ${tenantInfo.plan.name === 'Pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}>
              {tenantInfo.plan.name.toUpperCase()} PLAN
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Key Switcher */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground font-mono">TEST TENANT</span>
            <div className="flex gap-1.5">
              <Select
                className="flex-1 text-xs py-1.5"
                variant="primary"
                options={keyOptions}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={onAddTenantClick}
                className="bg-secondary border-2 border-foreground px-2 py-1 text-xs font-extrabold text-white hover:bg-secondary-hover rounded shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground font-mono">BILLING PERIOD</span>
            <Select
              className="text-xs py-1.5"
              options={periodOptions}
              value={selectedPeriod.name}
              onChange={(e) => {
                const p = periods.find(x => x.name === e.target.value);
                if (p) onPeriodChange(p);
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
