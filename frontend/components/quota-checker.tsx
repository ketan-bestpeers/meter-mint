'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface QuotaCheckerProps {
  checkQuota: (meterName: string, quantity: number) => Promise<{ allowed: boolean; remaining: number }>;
  loading: boolean;
}

export function QuotaChecker({ checkQuota, loading }: QuotaCheckerProps) {
  const [quotaMeter, setQuotaMeter] = useState<string>('api_calls');
  const [quotaQuantity, setQuotaQuantity] = useState<number>(1);
  const [quotaResult, setQuotaResult] = useState<{ allowed: boolean; remaining: number } | null>(null);
  const [checkingQuota, setCheckingQuota] = useState<boolean>(false);

  const handleQuotaCheck = async () => {
    setCheckingQuota(true);
    setQuotaResult(null);
    try {
      const res = await checkQuota(quotaMeter, quotaQuantity);
      setQuotaResult(res);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setCheckingQuota(false);
    }
  };

  const meterOptions = [
    { value: 'api_calls', label: 'api_calls' },
  ];

  return (
    <Card className="bg-card border-2 border-foreground text-foreground p-6 rounded-xl flex flex-col justify-between">
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
            <Select
              options={meterOptions}
              value={quotaMeter}
              onChange={(e) => setQuotaMeter(e.target.value)}
              className="p-2 h-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold font-mono">QUANTITY</label>
            <input
              type="number"
              min="1"
              className="bg-background text-foreground font-semibold text-sm border-2 border-foreground p-1.5 rounded focus:outline-none h-[34px]"
              value={quotaQuantity}
              onChange={(e) => setQuotaQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        {/* Quota Check Results */}
        {quotaResult && (
          <div className={`p-4 rounded-md border-2 mb-4 font-mono text-xs flex items-center justify-between transition-all duration-200 ${quotaResult.allowed
            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-red-100/70 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
            }`}>
            <div className="flex items-center gap-2">
              {quotaResult.allowed ? (
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={18} />
              ) : (
                <XCircle className="text-red-600 dark:text-red-400" size={18} />
              )}
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
        className="w-full border-2 border-foreground"
      >
        Verify Quota Allowance
      </Button>
    </Card>
  );
}
