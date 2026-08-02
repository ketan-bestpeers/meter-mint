'use client';

import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';
import { UsageOverview } from '@/components/usage-overview';
import { InvoicesTab } from '@/components/invoices-tab';
import { DeveloperConsole } from '@/components/developer-console';
import { OrganizationModal } from '@/components/organization-modal';

// Divided Section Components
import { Header } from '@/components/header';
import { TenantProfile } from '@/components/tenant-profile';
import { QuotaChecker } from '@/components/quota-checker';
import { ExecutionLogs } from '@/components/execution-logs';
import { Footer } from '@/components/footer';

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

  // Event ingestion logger simulator
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[SYSTEM] Dashboard initialized. Active API key: ${apiKey}`,
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    addLog(`Switched tenant API Key. Active Key: ${apiKey}`);
  }, [apiKey]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">

      {/* Divided Header Section */}
      <Header
        apiKey={apiKey}
        setApiKey={setApiKey}
        availableKeys={availableKeys}
        theme={theme}
        setTheme={setTheme}
        tenantInfo={tenantInfo}
        loading={loading}
        error={error}
        refresh={refresh}
        periods={PERIODS}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onAddTenantClick={() => setIsOrgModalOpen(true)}
      />

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

        {/* Divided Tenant Profile Section */}
        <TenantProfile
          tenantInfo={tenantInfo}
          loading={loading}
          apiKey={apiKey}
          refresh={refresh}
        />

        {/* Usage Overview Section */}
        <div className="grid grid-cols-1 gap-8">
          <UsageOverview />
        </div>

        {/* Interactive Developer Tools (Queue Event Ingester & Quota Check) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Developer Test Console */}
          <DeveloperConsole />

          {/* Divided Quota Verification Tool Section */}
          <QuotaChecker
            checkQuota={checkQuota}
            loading={loading}
          />
        </div>

        {/* Divided Simulated Terminal / Logger Section */}
        <ExecutionLogs
          logs={terminalLogs}
          onClear={() => setTerminalLogs([`[SYSTEM] Log cleared. Active key: ${apiKey}`])}
        />

        {/* Invoices Tab (History & Breakdown) */}
        <section className="bg-card border-2 border-foreground p-6 rounded-xl text-foreground">
          <InvoicesTab />
        </section>

      </main>

      {/* Divided Footer Section */}
      <Footer />

      {/* Organization Registration Modal */}
      <OrganizationModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />
    </div>
  );
}
