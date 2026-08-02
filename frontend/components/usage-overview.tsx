'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tag } from '@/components/ui/tag';
import { Activity, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

export function UsageOverview() {
  const { tenantInfo, usageInfo, loading } = useTenant();

  if (loading && !usageInfo) {
    return (
      <Card className="bg-card border-2 border-foreground text-foreground p-6 md:p-8 rounded-lg">
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
  let tagVariant: 'success' | 'warning' | 'error' = 'success';
  let statusIcon = <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={16} />;

  if (currentUsage >= limit) {
    if (allowOverage) {
      statusText = 'Overage Accruing';
      tagVariant = 'warning';
      statusIcon = <AlertTriangle className="text-amber-600 dark:text-amber-400 animate-pulse" size={16} />;
    } else {
      statusText = 'Hard Cap Reached';
      tagVariant = 'error';
      statusIcon = <ShieldAlert className="text-red-600 dark:text-red-400 animate-bounce" size={16} />;
    }
  }

  const usagePercent = Math.min(100, limit > 0 ? (currentUsage / limit) * 100 : 0);

  // Calculate potential overage costs
  const isOverage = currentUsage > limit;
  const overageUnits = isOverage ? currentUsage - limit : 0;
  const calculatedOverage = overageUnits * overagePrice;
  const estTotalCost = basePrice + calculatedOverage;

  const getProgressBarColor = () => {
    if (currentUsage >= limit) {
      return allowOverage ? '#f59e0b' : '#ef4444'; // amber-500 or red-500
    }
    if (usagePercent >= 80) {
      return '#fbbf24'; // amber-400
    }
    return '#10b981'; // emerald-500 / secondary
  };

  return (
    <Card className="bg-card border-2 border-foreground text-foreground p-6 md:p-8 rounded-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-foreground pb-4 mb-6 gap-2.5">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={24} strokeWidth={2.5} />
            <h3 className="text-xl font-extrabold">Usage Overview</h3>
          </div>
          <Tag variant={tagVariant} className="self-start sm:self-center">
            {statusIcon}
            <span>{statusText.toUpperCase()}</span>
          </Tag>
        </div>

        {/* Progress bar and numeric usage */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-muted-foreground">Volume Consumption (totalQuantity vs includedQuantity)</span>
            <span className="text-3xl font-extrabold font-mono">
              {currentUsage} <span className="text-lg font-medium text-muted-foreground">/ {limit}</span>
            </span>
          </div>

          {/* Common progress bar component */}
          <ProgressBar value={usagePercent} color={getProgressBarColor()} />

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
      <div className="mt-8 border-t-2 border-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 py-2.5 px-4 rounded-lg border-2 border-dashed border-border">
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
