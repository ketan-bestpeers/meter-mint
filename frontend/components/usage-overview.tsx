'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Card } from '@/components/ui/card';
import { Activity, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

export function UsageOverview() {
  const { tenantInfo, usageInfo, loading } = useTenant();

  if (loading && !usageInfo) {
    return (
      <Card className="bg-card border-4 border-foreground text-foreground p-6 md:p-8 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-none">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-primary animate-spin" size={24} strokeWidth={2.5} />
            <h3 className="text-xl font-extrabold">Usage Overview</h3>
          </div>
        </div>
        <p className="font-mono text-sm animate-pulse text-muted-foreground">Syncing usage statistics...</p>
      </Card>
    );
  }

  const currentUsage = usageInfo?.currentUsage || 0;
  const limit = usageInfo?.limit || tenantInfo?.plan?.includedQuantity || 0;
  const allowOverage = tenantInfo?.plan?.allowOverage || false;
  const basePrice = tenantInfo?.plan?.basePrice || 0;
  const overagePrice = tenantInfo?.plan?.overagePrice || 0;

  // Determine Quota Status
  let statusText = 'Within Quota';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700';
  let statusIcon = <CheckCircle className="text-emerald-500" size={16} />;

  if (currentUsage >= limit) {
    if (allowOverage) {
      statusText = 'Overage Accruing';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700';
      statusIcon = <AlertTriangle className="text-amber-500 animate-pulse" size={16} />;
    } else {
      statusText = 'Hard Cap Reached';
      badgeColor = 'bg-red-100 text-red-800 border-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-700';
      statusIcon = <ShieldAlert className="text-red-500 animate-bounce" size={16} />;
    }
  }

  const usagePercent = Math.min(100, limit > 0 ? (currentUsage / limit) * 100 : 0);

  // Calculate potential overage costs
  const isOverage = currentUsage > limit;
  const overageUnits = isOverage ? currentUsage - limit : 0;
  const calculatedOverage = overageUnits * overagePrice;
  const estTotalCost = basePrice + calculatedOverage;

  return (
    <Card className="bg-card border-4 border-foreground text-foreground p-6 md:p-8 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-none flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-foreground pb-4 mb-6 gap-2.5">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={24} strokeWidth={2.5} />
            <h3 className="text-xl font-extrabold">Usage Overview</h3>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-bold text-xs shadow-[2px_2px_0px_#000] dark:shadow-none self-start sm:self-center ${badgeColor}`}>
            {statusIcon}
            <span>{statusText.toUpperCase()}</span>
          </div>
        </div>

        {/* Progress bar and numeric usage */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-muted-foreground">Volume Consumption (totalQuantity vs includedQuantity)</span>
            <span className="text-3xl font-extrabold font-mono">
              {currentUsage} <span className="text-lg font-medium text-muted-foreground">/ {limit}</span>
            </span>
          </div>
          
          {/* Custom progress bar */}
          <div className="h-6 w-full bg-muted rounded-full border-2 border-foreground overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out border-r-2 border-foreground ${
                currentUsage >= limit 
                  ? allowOverage ? 'bg-amber-500' : 'bg-red-500' 
                  : usagePercent >= 80 
                  ? 'bg-amber-400' 
                  : 'bg-secondary'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-bold font-mono text-muted-foreground">
            <span>0%</span>
            {currentUsage >= limit && !allowOverage && (
              <span className="text-red-500 font-extrabold">HARD CAP REACHED</span>
            )}
            {currentUsage >= limit && allowOverage && (
              <span className="text-amber-500 font-extrabold">OVERAGE CHARGES ACCRUING</span>
            )}
            <span>100% ({limit} calls limit)</span>
          </div>
        </div>

        {/* Limits Explanation Block */}
        <div className="mt-6 p-4 rounded-md border-2 border-foreground bg-muted/40 font-mono text-xs flex flex-col gap-2">
          <div className="flex justify-between">
            <span>PLAN BASE PRICE:</span>
            <span className="font-bold text-foreground">${basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>INCLUDED CALLS:</span>
            <span className="font-bold text-foreground">{limit} calls</span>
          </div>
          <div className="flex justify-between">
            <span>ALLOW OVERAGE:</span>
            <span className={`font-bold ${allowOverage ? 'text-secondary' : 'text-red-500'}`}>
              {allowOverage ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>OVERAGE PRICE:</span>
            <span className="font-bold text-foreground">${overagePrice.toFixed(4)} per call</span>
          </div>
        </div>
      </div>

      {/* Estimate Bill Calculation Preview */}
      <div className="mt-8 border-t-2 border-foreground pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border-2 border-dashed border-border">
        <div>
          <h4 className="text-sm font-bold text-muted-foreground uppercase font-mono">Estimated Billing Volume</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Calculated dynamically based on base + overages</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold font-mono">${estTotalCost.toFixed(2)}</span>
          <div className="text-[10px] text-muted-foreground font-mono">
            (${basePrice.toFixed(2)} Base + ${calculatedOverage.toFixed(2)} Overage)
          </div>
        </div>
      </div>
    </Card>
  );
}
