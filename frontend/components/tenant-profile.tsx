'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TenantInfo } from '@/lib/tenant-context';

interface TenantProfileProps {
  tenantInfo: TenantInfo | null;
  loading: boolean;
  apiKey: string;
  refresh: () => Promise<void>;
}

export function TenantProfile({
  tenantInfo,
  loading,
  apiKey,
  refresh,
}: TenantProfileProps) {
  return (
    <section className="bg-muted border-2 border-foreground p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">Tenant Profile</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
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
          className="border-2 border-foreground bg-card text-foreground"
          leftIcon={<RefreshCw className={loading ? 'animate-spin' : ''} size={18} />}
        >
          Sync Dashboard
        </Button>
      </div>
    </section>
  );
}
