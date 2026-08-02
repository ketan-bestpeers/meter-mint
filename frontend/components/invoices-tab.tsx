'use client';

import React, { useState } from 'react';
import { useTenant, Invoice } from '@/lib/tenant-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tag } from '@/components/ui/tag';
import { FileText, Calendar, DollarSign, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

const PERIODS = [
  { name: 'Aug 2026 (Current)', start: '2026-08-01T00:00:00.000Z', end: '2026-09-01T00:00:00.000Z' },
  { name: 'Jul 2026 (Previous)', start: '2026-07-01T00:00:00.000Z', end: '2026-08-01T00:00:00.000Z' },
  { name: 'Jun 2026 (Historical)', start: '2026-06-01T00:00:00.000Z', end: '2026-07-01T00:00:00.000Z' },
];

export function InvoicesTab() {
  const { tenantInfo, invoices, loading, generateInvoice, refresh } = useTenant();
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setMsg(null);
    try {
      const res = await generateInvoice(selectedPeriod.start, selectedPeriod.end);
      setMsg(`Success: Invoice generated! Total: $${res.totalAmount.toFixed(2)}`);
      setSelectedInvoiceId(res.id);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setMsg(`Error: ${errMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  // Safe division to find historical rate, defaulting to current plan's overage price
  const getRate = (inv: Invoice) => {
    if (inv.overageUnits > 0) {
      return inv.overageAmount / inv.overageUnits;
    }
    return tenantInfo?.plan?.overagePrice || 0;
  };

  const getPlanName = (inv: Invoice) => {
    if (inv.basePrice === 20 || inv.totalAmount > 20) {
      return 'Pro Plan';
    }
    if (inv.basePrice === 0) {
      return 'Free Plan';
    }
    return tenantInfo?.plan?.name ? `${tenantInfo.plan.name} Plan` : 'Standard Plan';
  };

  // Included units for the invoice
  const getIncludedUnits = (inv: Invoice) => {
    if (inv.basePrice === 20) return 1000;
    if (inv.basePrice === 0) return 100;
    return tenantInfo?.plan?.includedQuantity || 0;
  };

  const getPeriodDisplayName = (name: string) => {
    if (name.includes('(Current)')) return name;
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const periodOptions = PERIODS.map(p => ({
    value: p.name,
    label: getPeriodDisplayName(p.name),
  }));

  return (
    <div className="flex flex-col gap-6">

      {/* Top action panel: Invoicing Period Selection and Trigger */}
      <Card className="bg-card border-2 border-foreground text-foreground p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">Billing Control Center</span>
            <h3 className="text-xl font-extrabold">Generate Bill Record</h3>
            <p className="text-xs text-muted-foreground">Select a historical month cycle to generate or update the finalized invoice record.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-muted-foreground uppercase">Target Period:</span>
              <Select
                options={periodOptions}
                value={selectedPeriod.name}
                onChange={(e) => {
                  const p = PERIODS.find(x => x.name === e.target.value);
                  if (p) setSelectedPeriod(p);
                }}
                className="text-xs py-1.5"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || loading}
              isLoading={generating}
              variant="default"
              size="sm"
              className="border-2 border-foreground"
              leftIcon={<FileText size={16} />}
            >
              Generate Invoice
            </Button>
          </div>
        </div>

        {msg && (
          <div className={`mt-4 p-3 rounded border-2 text-xs font-mono break-all transition-colors duration-200 ${msg.startsWith('Error')
            ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
            }`}>
            {msg}
          </div>
        )}
      </Card>

      {/* Main split tab layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: List of Invoices */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-foreground pb-2.5">
            <h4 className="text-sm font-extrabold font-mono uppercase tracking-wider">Invoice History ({invoices.length})</h4>
            <button
              type="button"
              onClick={() => refresh()}
              className="text-[10px] font-bold text-primary font-mono flex items-center gap-1 hover:underline"
            >
              <RefreshCw size={10} /> Reload
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {invoices.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded bg-muted/10 text-muted-foreground font-mono text-xs">
                No invoices on record.
              </div>
            ) : (
              invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`text-left p-4 rounded border-2 transition-all duration-200 ${isSelected
                      ? 'border-primary bg-primary/5 shadow-[2px_2px_0px_#000] dark:shadow-none'
                      : 'border-foreground hover:bg-muted/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs">#{inv.id.substring(0, 8)}</span>
                      <span className="font-mono font-extrabold text-sm">${inv.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 font-mono">
                      <Calendar size={10} />
                      <span>{formatDate(inv.periodStart)} - {formatDate(inv.periodEnd)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Gorgeous Breakdown Card detail */}
        <div className="lg:col-span-2">
          {selectedInvoice ? (
            <Card className="bg-card border-2 border-foreground text-foreground p-6 md:p-8 rounded-lg flex flex-col justify-between h-full">
              <div>
                {/* Header: Plan & dates */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-foreground pb-4 mb-6 gap-2">
                  <div>
                    <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">Itemized Breakdown</span>
                    <h3 className="text-xl font-extrabold mt-0.5">{getPlanName(selectedInvoice)}</h3>
                  </div>
                  <Tag variant="success" className="font-sans">
                    <CheckCircle2 size={12} />
                    <span>PAID RECORD</span>
                  </Tag>
                </div>

                {/* Period Dates */}
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground bg-muted/40 p-3 rounded mb-6 border border-border">
                  <Calendar size={14} className="text-primary" />
                  <span>Cycle Period: {formatDate(selectedInvoice.periodStart)} - {formatDate(selectedInvoice.periodEnd)}</span>
                </div>

                {/* Line items details list */}
                <div className="flex flex-col gap-4 font-mono text-xs">

                  {/* Line Item 1: Base Price */}
                  <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">Base Subscription Fee</span>
                      <span className="text-[10px] text-muted-foreground">Fixed monthly recurring cost</span>
                    </div>
                    <span className="font-extrabold text-sm">${selectedInvoice.basePrice.toFixed(2)}</span>
                  </div>

                  {/* Line Item 2: Included Units */}
                  <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">Plan Capacity Allowance</span>
                      <span className="text-[10px] text-muted-foreground">Included units in base package</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{getIncludedUnits(selectedInvoice)} units</span>
                  </div>

                  {/* Line Item 3: Overage Units x Rate */}
                  <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">Usage Overage Charges</span>
                      <span className="text-[10px] text-muted-foreground">
                        {selectedInvoice.overageUnits} units excess x ${getRate(selectedInvoice).toFixed(4)} / unit
                      </span>
                    </div>
                    <span className="font-extrabold text-sm">${selectedInvoice.overageAmount.toFixed(2)}</span>
                  </div>

                  {/* Line Item 4: Calculated units comparison */}
                  <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">Consumptive Billable Units</span>
                      <span className="text-[10px] text-muted-foreground">Included units vs total usage</span>
                    </div>
                    <span className="font-bold text-foreground">
                      {getIncludedUnits(selectedInvoice)} included + {selectedInvoice.overageUnits} overage
                    </span>
                  </div>

                </div>
              </div>

              {/* Total breakdown block */}
              <div className="mt-8 border-t-4 border-foreground pt-6 flex items-center justify-between bg-muted/30 p-5 rounded-lg border-2 border-foreground">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-secondary" />
                  <span className="font-bold font-mono text-sm uppercase text-foreground">Final Calculated Total</span>
                </div>
                <div className="text-right flex items-center gap-1 text-foreground">
                  <DollarSign size={24} className="text-secondary" strokeWidth={3} />
                  <span className="text-4xl font-extrabold font-mono">{selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-border rounded-lg bg-muted/10 h-full flex flex-col justify-center items-center">
              <FileText className="text-muted-foreground opacity-30 mb-4" size={64} />
              <p className="font-bold text-lg text-muted-foreground">Select an Invoice to View Breakdown</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">History is loaded from database.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
