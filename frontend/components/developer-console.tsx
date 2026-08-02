'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCw, Layers, Play, Copy } from 'lucide-react';

export function DeveloperConsole() {
  const { apiKey, refresh } = useTenant();

  // Inputs
  const [eventId, setEventId] = useState<string>(() => generateEventId());
  const [meter] = useState<string>('api_calls');
  const [quantity, setQuantity] = useState<number>(1);

  // States
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  // Metrics
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [avgLatency, setAvgLatency] = useState<number | null>(null);

  // Console Logs
  const [logs, setLogs] = useState<string[]>([
    `[SYSTEM] Developer Test Console ready. Connected to tenant via API Key.`,
  ]);

  function generateEventId() {
    return `evt_${Math.random().toString(36).substring(2, 11)}${Math.random().toString(36).substring(2, 6)}`;
  }

  const handleGenerateId = () => {
    setEventId(generateEventId());
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-14), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Sends a single custom event
  const sendSingleEvent = async (customEventId: string, customQty: number, logName = 'Custom Event') => {
    const payload = {
      eventId: customEventId,
      meter,
      quantity: customQty,
      timestamp: new Date().toISOString(),
    };

    const start = performance.now();
    try {
      const response = await fetch('http://localhost:4000/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const end = performance.now();
      const latency = end - start;
      setLastLatency(latency);

      if (response.status === 202) {
        setSuccessCount(prev => prev + 1);
        addLog(`[${logName}] status=202 Accepted | latency=${latency.toFixed(1)}ms | id=${customEventId}`);
        setLastEventId(customEventId);
        return true;
      } else {
        const bodyText = await response.text();
        setFailedCount(prev => prev + 1);
        addLog(`[${logName}] [FAILED] status=${response.status} | latency=${latency.toFixed(1)}ms | error=${bodyText}`);
        return false;
      }
    } catch (err: unknown) {
      const end = performance.now();
      const latency = end - start;
      const errMsg = err instanceof Error ? err.message : 'Connection failed';
      setFailedCount(prev => prev + 1);
      addLog(`[${logName}] [ERROR] latency=${latency.toFixed(1)}ms | error=${errMsg}`);
      return false;
    }
  };

  const handleSendCustom = async () => {
    setSending(true);
    await sendSingleEvent(eventId, quantity, 'Custom Event');
    handleGenerateId(); // Auto-rotate key after manual send
    setSending(false);
    
    // Refresh parent page aggregates after brief queue processing delay
    setTimeout(() => {
      refresh();
    }, 600);
  };

  const handleSendDuplicate = async () => {
    if (!lastEventId) {
      addLog(`[SYSTEM] No previous event logged. Please trigger a standard event first.`);
      return;
    }
    setSending(true);
    addLog(`[Deduplication Test] Sending duplicate event using key: ${lastEventId}`);
    await sendSingleEvent(lastEventId, quantity, 'Duplicate Event');
    setSending(false);
    
    setTimeout(() => {
      refresh();
    }, 600);
  };

  // Simulates 150 separate events
  const handleSimulate150 = async () => {
    setSending(true);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);
    addLog(`[Load Test] Kicking off stress test of 150 separate events...`);

    const batchSize = 10;
    const totalEvents = 150;
    const latencies: number[] = [];

    for (let i = 0; i < totalEvents; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, totalEvents - i);
      const batchPromises = Array.from({ length: currentBatchSize }).map(async (_, idx) => {
        const id = `evt_load_${i + idx}_${Math.random().toString(36).substring(2, 7)}`;
        const payload = {
          eventId: id,
          meter,
          quantity: 1,
          timestamp: new Date().toISOString(),
        };

        const start = performance.now();
        try {
          const response = await fetch('http://localhost:4000/api/v1/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify(payload),
          });
          const end = performance.now();
          latencies.push(end - start);
          return response.status === 202;
        } catch {
          const end = performance.now();
          latencies.push(end - start);
          return false;
        }
      });

      const results = await Promise.all(batchPromises);
      const batchSuccess = results.filter(Boolean).length;
      setSuccessCount(prev => prev + batchSuccess);
      setFailedCount(prev => prev + (currentBatchSize - batchSuccess));

      const currentProgress = Math.round(((i + currentBatchSize) / totalEvents) * 100);
      setProgress(currentProgress);
      
      // Calculate running average latency
      const avg = latencies.reduce((s, x) => s + x, 0) / latencies.length;
      setAvgLatency(avg);
    }

    addLog(`[Load Test] Finished! Success=${totalEvents - failedCount}/${totalEvents} | Avg Latency=${(latencies.reduce((s, x) => s + x, 0) / latencies.length).toFixed(1)}ms`);
    setProgress(null);
    setSending(false);

    // Refresh context usage
    setTimeout(() => {
      refresh();
    }, 800);
  };

  return (
    <Card className="bg-card border-4 border-foreground text-foreground p-6 rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-none">
      <div className="flex items-center justify-between border-b-2 border-foreground pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Zap className="text-accent animate-pulse" size={24} strokeWidth={2.5} />
          <h3 className="text-xl font-extrabold">Developer Test Console</h3>
        </div>
        <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
          Active key: {apiKey.substring(0, 12)}...
        </span>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 font-mono text-xs">
        
        {/* Event ID */}
        <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
          <label className="font-bold text-muted-foreground uppercase">Event ID (Deduplication Key)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="flex-1 bg-background text-foreground border-2 border-foreground p-2 rounded font-bold focus:outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateId}
              className="border-2 border-foreground p-2 h-auto"
              title="Generate new Event ID"
            >
              <RefreshCw size={14} className={sending ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-1.5 col-span-1">
          <label className="font-bold text-muted-foreground uppercase">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-background text-foreground border-2 border-foreground p-2 rounded font-bold focus:outline-none text-center"
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Button
          onClick={handleSendCustom}
          disabled={sending}
          variant="default"
          size="sm"
          className="border-2 border-foreground py-2 text-xs"
          leftIcon={<Play size={14} fill="currentColor" />}
        >
          Send 1 Event
        </Button>

        <Button
          onClick={handleSendDuplicate}
          disabled={sending || !lastEventId}
          variant="outline"
          size="sm"
          className="border-2 border-foreground py-2 text-xs"
          leftIcon={<Copy size={14} />}
        >
          Send Duplicate
        </Button>

        <Button
          onClick={handleSimulate150}
          disabled={sending}
          variant="secondary"
          size="sm"
          className="border-2 border-foreground py-2 text-xs bg-muted text-foreground hover:bg-muted-hover"
          leftIcon={<Layers size={14} />}
        >
          Simulate 150 Events
        </Button>
      </div>

      {/* Progress Bar (Load Testing) */}
      {progress !== null && (
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono font-bold text-muted-foreground mb-1.5">
            <span>Simulating Load Queue...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-4 w-full bg-muted border-2 border-foreground rounded overflow-hidden p-0.5">
            <div 
              className="h-full bg-primary rounded transition-all duration-300 border-r border-foreground"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Timing Metrics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md border-2 border-foreground bg-muted/40 font-mono text-xs mb-5">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Success</span>
          <span className="text-lg font-extrabold text-secondary">{successCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Failed / Dup</span>
          <span className="text-lg font-extrabold text-red-500">{failedCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Last Latency</span>
          <span className="text-lg font-extrabold text-foreground">
            {lastLatency !== null ? `${lastLatency.toFixed(1)}ms` : '-'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Avg Latency</span>
          <span className="text-lg font-extrabold text-primary">
            {avgLatency !== null ? `${avgLatency.toFixed(1)}ms` : '-'}
          </span>
        </div>
      </div>

      {/* Scrollable logs */}
      <div className="bg-foreground text-white border-2 border-foreground p-4 rounded font-mono text-[10px] max-h-36 overflow-y-auto flex flex-col gap-1 text-emerald-400">
        {logs.map((log, index) => (
          <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
        ))}
      </div>
    </Card>
  );
}
