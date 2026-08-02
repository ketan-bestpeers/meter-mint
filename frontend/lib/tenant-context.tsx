'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './api-client';

export type Theme = 'flat' | 'dark';

export interface TenantInfo {
  id: string;
  name: string;
  apiKey: string;
  plan: {
    id: string;
    name: string;
    includedQuantity: number;
    allowOverage: boolean;
    overagePrice: number;
    basePrice: number;
  };
}

export interface TenantKeyOption {
  apiKey: string;
  name: string;
}

export interface UsageInfo {
  currentUsage: number;
  limit: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  basePrice: number;
  overageUnits: number;
  overageAmount: number;
  totalAmount: number;
  createdAt: string;
}

interface TenantContextProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  availableKeys: TenantKeyOption[];
  addCustomKey: (apiKey: string, name: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  tenantInfo: TenantInfo | null;
  usageInfo: UsageInfo | null;
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generateInvoice: (periodStart: string, periodEnd: string) => Promise<Invoice>;
  ingestEvent: (meterName: string, quantity: number) => Promise<{ status: string; eventId: string }>;
  checkQuota: (meterName: string, quantity: number) => Promise<{ allowed: boolean; remaining: number }>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyInternal] = useState<string>('sk_test_free_123');
  const [availableKeys, setAvailableKeys] = useState<TenantKeyOption[]>([
    { apiKey: 'sk_test_free_123', name: 'Free Tenant' },
    { apiKey: 'sk_test_pro_456', name: 'Pro Tenant' },
  ]);
  const [theme, setThemeInternal] = useState<Theme>('flat');
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize values from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = window.localStorage.getItem('metermint_api_key');
      if (storedKey) {
        setApiKeyInternal(storedKey);
      }
      
      const storedTheme = window.localStorage.getItem('metermint_theme') as Theme;
      if (storedTheme === 'flat' || storedTheme === 'dark') {
        setThemeInternal(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'flat');
      }

      const customKeysJson = window.localStorage.getItem('metermint_custom_keys');
      if (customKeysJson) {
        try {
          const customKeys = JSON.parse(customKeysJson) as TenantKeyOption[];
          setAvailableKeys([
            { apiKey: 'sk_test_free_123', name: 'Free Tenant' },
            { apiKey: 'sk_test_pro_456', name: 'Pro Tenant' },
            ...customKeys
          ]);
        } catch (e) {
          console.error('Failed to parse custom API keys', e);
        }
      }
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metermint_api_key', key);
    }
    setApiKeyInternal(key);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metermint_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    setThemeInternal(newTheme);
  }, []);

  const addCustomKey = useCallback((newKey: string, name: string) => {
    setAvailableKeys(prev => {
      const exists = prev.some(x => x.apiKey === newKey);
      if (exists) return prev;
      
      const updated = [...prev, { apiKey: newKey, name }];
      
      if (typeof window !== 'undefined') {
        const customKeysOnly = updated.filter(x => x.apiKey !== 'sk_test_free_123' && x.apiKey !== 'sk_test_pro_456');
        window.localStorage.setItem('metermint_custom_keys', JSON.stringify(customKeysOnly));
      }
      return updated;
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metermint_api_key', newKey);
    }
    setApiKeyInternal(newKey);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First verify and get profile
      const authResponse = await apiClient.get<{ tenant: TenantInfo }>('/test-auth');
      setTenantInfo(authResponse.tenant);

      // Fetch current usage & invoices concurrently
      const [usageData, invoicesData] = await Promise.all([
        apiClient.get<UsageInfo>('/v1/usage/current'),
        apiClient.get<Invoice[]>('/v1/invoices'),
      ]);

      setUsageInfo(usageData);
      setInvoices(invoicesData);
    } catch (err: unknown) {
      console.error('Error fetching tenant details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch details from the backend server.');
      setTenantInfo(null);
      setUsageInfo(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []); // Stable refresh callback

  // Trigger refresh when API key changes
  useEffect(() => {
    refresh();
  }, [apiKey, refresh]);

  // Periodic auto-refresh every 5 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const generateInvoice = useCallback(async (periodStart: string, periodEnd: string): Promise<Invoice> => {
    const result = await apiClient.get<Invoice>('/v1/invoices/generate', {
      params: { periodStart, periodEnd }
    });
    // Refresh invoices list after generation
    await refresh();
    return result;
  }, [refresh]);

  const ingestEvent = useCallback(async (meterName: string, quantity: number) => {
    const eventId = `evt_${Math.random().toString(36).substring(2, 11)}`;
    const payload = {
      eventId,
      meter: meterName,
      quantity,
      timestamp: new Date().toISOString(),
    };
    const response = await apiClient.post<{ status: string; eventId: string }>('/v1/events', payload);
    // Give a short delay for BullMQ / DB to reflect aggregates, then refresh
    setTimeout(() => {
      refresh();
    }, 600);
    return response;
  }, [refresh]);

  const checkQuota = useCallback(async (meterName: string, quantity: number) => {
    return apiClient.get<{ allowed: boolean; remaining: number }>('/v1/quota/check', {
      params: {
        meter: meterName,
        quantity: quantity.toString(),
      }
    });
  }, []);

  return (
    <TenantContext.Provider
      value={{
        apiKey,
        setApiKey,
        availableKeys,
        addCustomKey,
        theme,
        setTheme,
        tenantInfo,
        usageInfo,
        invoices,
        loading,
        error,
        refresh,
        generateInvoice,
        ingestEvent,
        checkQuota,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
