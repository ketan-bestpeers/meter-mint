'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, Copy, Layers, Server, ShieldCheck } from 'lucide-react';
import { BASE_URL } from '@/lib/api-client';

interface Plan {
  id: string;
  name: string;
  includedQuantity: number;
  allowOverage: boolean;
  overagePrice: number;
  basePrice: number;
}

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationModal({ isOpen, onClose }: OrganizationModalProps) {
  const { addCustomKey } = useTenant();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success state holds the newly generated organization information
  const [createdOrg, setCreatedOrg] = useState<{ name: string; apiKey: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch plans dynamically from database
  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open
    setOrgName('');
    setSelectedPlanId('');
    setCreatedOrg(null);
    setCopied(false);
    setErrorMsg(null);
    setLoadingPlans(true);

    fetch(`${BASE_URL.replace(/\/$/, '')}/organizations/plans`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load plans');
        return res.json();
      })
      .then((data: Plan[]) => {
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      })
      .catch(err => {
        setErrorMsg(err instanceof Error ? err.message : 'Plan fetch failed');
      })
      .finally(() => {
        setLoadingPlans(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setErrorMsg('Organization name is required');
      return;
    }
    if (!selectedPlanId) {
      setErrorMsg('Please select a billing plan');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: orgName,
          planId: selectedPlanId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Registration failed');
      }

      const data = await res.json();
      const newOrg = data.organization;

      setCreatedOrg({
        name: newOrg.name,
        apiKey: newOrg.apiKey,
      });

      // Inject key option into tenant context (sets active and saves to localStorage)
      addCustomKey(newOrg.apiKey, newOrg.name);

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdOrg) {
      navigator.clipboard.writeText(createdOrg.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-card border-2 border-foreground text-foreground rounded-lg shadow-[8px_8px_0px_#000] dark:shadow-none p-6 md:p-8 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-foreground pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="text-primary" size={24} />
            <h3 className="text-xl font-extrabold">Subscribe New Organization</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded border-2 border-foreground hover:bg-muted/30"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded border border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {createdOrg ? (
          /* Success Screen */
          <div className="flex flex-col gap-5 text-center items-center py-4">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_#000] dark:shadow-none mb-2">
              <ShieldCheck size={36} />
            </div>

            <div>
              <h4 className="text-lg font-extrabold">Tenant Subscribed Successfully!</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md font-mono">
                Organization <strong className="text-foreground">{createdOrg.name}</strong> is now live on the database.
              </p>
            </div>

            {/* API Key Box */}
            <div className="w-full font-mono text-xs p-4 rounded bg-muted border-2 border-foreground flex items-center justify-between gap-3 shadow-[2px_2px_0px_#000] dark:shadow-none">
              <div className="text-left select-all overflow-x-auto truncate">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">Your API Key</span>
                <code className="font-bold text-primary">{createdOrg.apiKey}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-2 border-foreground shrink-0"
              >
                {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground font-mono">
              The dashboard will automatically switch to this tenant upon closing.
            </p>

            <Button
              onClick={onClose}
              variant="default"
              className="w-full border-2 border-foreground mt-2 font-mono font-bold"
            >
              Close & Switch
            </Button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Org Name */}
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <label className="font-bold text-muted-foreground uppercase">Organization Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={submitting}
                className="bg-background text-foreground border-2 border-foreground p-3 rounded font-bold text-sm focus:outline-none"
                required
              />
            </div>

            {/* Plan selection */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <label className="font-bold text-muted-foreground uppercase">Select Subscription Plan</label>

              {loadingPlans ? (
                <div className="text-center py-8 font-bold text-muted-foreground">
                  Loading plan configurations...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlanId(p.id)}
                        disabled={submitting}
                        className={`text-left p-4 rounded border-2 transition-all duration-150 flex flex-col justify-between ${isSelected
                            ? 'border-primary bg-primary/5 shadow-[3px_3px_0px_#000] dark:shadow-none'
                            : 'border-foreground hover:bg-muted/30'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-foreground pb-1.5 mb-2.5">
                            <span className="font-extrabold text-sm text-foreground">{p.name}</span>
                            <span className="font-extrabold text-xs text-primary">${p.basePrice}/mo</span>
                          </div>

                          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
                            <span>Allowance: {p.includedQuantity} calls</span>
                            <span>Overage Rate: ${p.overagePrice}/unit</span>
                            <span>Overage allowed: {p.allowOverage ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 border-t-2 border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="w-1/3 border-2 border-foreground font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={submitting || loadingPlans}
                isLoading={submitting}
                className="w-2/3 border-2 border-foreground font-mono"
                leftIcon={<Server size={14} />}
              >
                Create & Subscribe
              </Button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
