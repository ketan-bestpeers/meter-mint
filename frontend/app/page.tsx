'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Sun, 
  Moon, 
  RefreshCw, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UsageOverview } from '@/components/usage-overview';
import { InvoicesTab } from '@/components/invoices-tab';
import { DeveloperConsole } from '@/components/developer-console';
import { OrganizationModal } from '@/components/organization-modal';

const PERIODS = [
  { name: 'Aug 2026 (Current)', start: '2026-08-01T00:00:00.000Z', end: '2026-09-01T00:00:00.000Z' },
  { name: 'Jul 2026 (Previous)', start: '2026-07-01T00:00:00.000Z', end: '2026-08-01T00:00:00.000Z' },
  { name: 'Jun 2026 (Historical)', start: '2026-06-01T00:00:00.000Z', end: '2026-07-01T00:00:00.000Z' },
];

export default function Dashboard() {
  const {
    apiKey,
    setApiKey,
    availableKeys,
    theme,
    setTheme,
    tenantInfo,
    loading,
    error,
    refresh,
    checkQuota,
  } = useTenant();

  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);


  // Quota check inputs
  const [quotaMeter, setQuotaMeter] = useState<string>('api_calls');
  const [quotaQuantity, setQuotaQuantity] = useState<number>(1);
  const [quotaResult, setQuotaResult] = useState<{ allowed: boolean; remaining: number } | null>(null);
  const [checkingQuota, setCheckingQuota] = useState<boolean>(false);



  // Event ingestion logger simulator
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[SYSTEM] Dashboard initialized. Active API key: ${apiKey}`,
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    addLog(`Switched tenant API Key. Active Key: ${apiKey}`);
    setQuotaResult(null);
  }, [apiKey]);



  const handleQuotaCheck = async () => {
    setCheckingQuota(true);
    setQuotaResult(null);
    try {
      addLog(`Checking quota GET /v1/quota/check (meter: ${quotaMeter}, qty: ${quotaQuantity})...`);
      const res = await checkQuota(quotaMeter, quotaQuantity);
      setQuotaResult(res);
      addLog(`Quota result: allowed=${res.allowed}, remaining allowance=${res.remaining}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`[ERROR] Quota check failed: ${msg}`);
    } finally {
      setCheckingQuota(false);
    }
  };




  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="border-b-4 border-foreground bg-card sticky top-0 z-50 transition-colors duration-200">
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
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-foreground font-bold text-xs shadow-[2px_2px_0px_#000] dark:shadow-none ${
                tenantInfo.plan.name === 'Pro' 
                  ? 'bg-amber-100 text-amber-800 border-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700' 
                  : 'bg-blue-100 text-blue-800 border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
              }`}>
                <span>{tenantInfo.plan.name.toUpperCase()} PLAN</span>
              </div>
            )}

            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase font-mono">Period:</span>
              <select
                className="bg-background text-foreground font-semibold text-sm border-2 border-foreground px-2.5 py-1 rounded focus:outline-none cursor-pointer"
                value={selectedPeriod.name}
                onChange={(e) => {
                  const p = PERIODS.find(x => x.name === e.target.value);
                  if (p) setSelectedPeriod(p);
                }}
              >
                {PERIODS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Tenant Switcher Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase font-mono">API Key:</span>
              <select
                className="bg-primary text-white font-extrabold text-sm border-2 border-foreground px-3 py-1 rounded shadow-[2px_2px_0px_#000] dark:shadow-none focus:outline-none cursor-pointer hover:bg-primary-hover animate-in fade-in"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              >
                {availableKeys.map(opt => (
                  <option key={opt.apiKey} value={opt.apiKey}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOrgModalOpen(true)}
                className="border-2 border-foreground bg-secondary font-bold text-xs shrink-0"
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
              <span className={`px-2.5 py-0.5 rounded-full border border-foreground font-bold text-xs ${
                tenantInfo.plan.name === 'Pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
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
                <select
                  className="flex-1 bg-primary text-white font-extrabold text-xs border-2 border-foreground px-2 py-1.5 rounded focus:outline-none cursor-pointer"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                >
                  {availableKeys.map(opt => (
                    <option key={opt.apiKey} value={opt.apiKey}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(true)}
                  className="bg-secondary border-2 border-foreground px-2 py-1 text-xs font-extrabold text-foreground rounded shrink-0"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Period Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground font-mono">BILLING PERIOD</span>
              <select
                className="bg-background text-foreground font-semibold text-xs border-2 border-foreground px-2 py-1.5 rounded focus:outline-none cursor-pointer"
                value={selectedPeriod.name}
                onChange={(e) => {
                  const p = PERIODS.find(x => x.name === e.target.value);
                  if (p) setSelectedPeriod(p);
                }}
              >
                {PERIODS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner or Offline Indicator */}
      {error && (
        <div className="bg-red-500/10 border-b-4 border-red-500 py-4 px-6 text-red-700 dark:text-red-300 font-medium">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500 shrink-0" size={24} />
              <div>
                <p className="font-bold">Backend Connection Failed</p>
                <p className="text-sm opacity-90">Verify PostgreSQL/Redis are running and API port is set correctly on localhost:4000.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="border-red-500 text-red-700 hover:bg-red-500 hover:text-white dark:text-red-300 dark:hover:text-slate-900 border-2 rounded bg-transparent"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* Row 1: Tenant Information Header */}
        <section className="bg-muted border-4 border-foreground p-6 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">Tenant Profile</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">
              {tenantInfo?.name || (loading ? 'Loading tenant details...' : 'Unknown Tenant')}
            </h2>
            <p className="text-sm font-mono text-muted-foreground mt-1 select-all">
              API Key: {tenantInfo?.apiKey || apiKey}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => refresh()}
              disabled={loading}
              className="border-4 border-foreground bg-white text-foreground"
              leftIcon={<RefreshCw className={loading ? 'animate-spin' : ''} size={18} />}
            >
              Sync Dashboard
            </Button>
          </div>
        </section>

        {/* Row 2: Metrics Visualization */}
        <div className="grid grid-cols-1 gap-8">
          {/* Card 1: Current Ingest Usage vs Plan Limit */}
          <div className="flex flex-col">
            <UsageOverview />
          </div>
        </div>

        {/* Row 3: Interactive Developer Tools (Queue Event Ingester & Quota Check) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 3: Developer Test Console */}
          <DeveloperConsole />

          {/* Card 4: Quota Verification Tool */}
          <Card className="bg-card border-4 border-foreground text-foreground p-6 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-foreground pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Shield className="text-primary" size={24} strokeWidth={2.5} />
                  <h3 className="text-xl font-extrabold">Quota Authorization Check</h3>
                </div>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">GET /v1/quota/check</span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Verify if the tenant has enough capacity left to handle a projected quantity request under rate limiting constraints.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold font-mono">METER NAME</label>
                  <select
                    className="bg-background text-foreground font-semibold text-sm border-2 border-foreground p-2 rounded focus:outline-none"
                    value={quotaMeter}
                    onChange={(e) => setQuotaMeter(e.target.value)}
                  >
                    <option value="api_calls">api_calls</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold font-mono">QUANTITY</label>
                  <input
                    type="number"
                    min="1"
                    className="bg-background text-foreground font-semibold text-sm border-2 border-foreground p-1.5 rounded focus:outline-none"
                    value={quotaQuantity}
                    onChange={(e) => setQuotaQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              {/* Quota Check Results */}
              {quotaResult && (
                <div className={`p-4 rounded-md border-2 border-foreground mb-4 font-mono text-xs flex items-center justify-between ${
                  quotaResult.allowed 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {quotaResult.allowed ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
                    <div>
                      <p className="font-bold">{quotaResult.allowed ? 'AUTHORIZATION GRANTED' : 'LIMIT EXCEEDED'}</p>
                      <p className="text-[10px] opacity-80">Quota limit verifies correctly against current aggregates.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold">{quotaResult.remaining}</span>
                    <p className="text-[9px] opacity-75">Remaining units</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleQuotaCheck}
              disabled={checkingQuota || loading}
              isLoading={checkingQuota}
              variant="outline"
              className="w-full border-4 border-foreground"
            >
              Verify Quota Allowance
            </Button>
          </Card>
        </div>

        {/* Row 4: Simulated Terminal / Logger */}
        <section className="bg-foreground text-white border-4 border-white p-6 rounded-lg font-mono text-xs shadow-[4px_4px_0px_#000] dark:shadow-none">
          <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="text-primary animate-pulse" size={18} />
              <span className="font-bold">Console Execution Logs (Dev Stream)</span>
            </div>
            <button 
              onClick={() => setTerminalLogs([`[SYSTEM] Log cleared. Active key: ${apiKey}`])}
              className="hover:underline text-[10px] text-white/50"
            >
              Clear Logs
            </button>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48 text-emerald-400">
            {terminalLogs.map((log, index) => (
              <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
            ))}
          </div>
        </section>

        {/* Row 5: Invoices Tab (History & Breakdown) */}
        <section className="bg-card border-4 border-foreground p-6 rounded-lg text-foreground shadow-[4px_4px_0px_#000] dark:shadow-none">
          <InvoicesTab />
        </section>

      </main>

      {/* Footer */}
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
      {/* Organization Registration Modal */}
      <OrganizationModal 
        isOpen={isOrgModalOpen} 
        onClose={() => setIsOrgModalOpen(false)} 
      />
    </div>
  );
}

