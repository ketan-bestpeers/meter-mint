'use client';

import React, { useState } from 'react';
import { 
  Key, 
  Activity, 
  DollarSign, 
  Zap, 
  Shield, 
  Terminal, 
  ArrowRight, 
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/components/ui/link';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b-4 border-foreground bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-md border-2 border-foreground text-white font-extrabold text-xl">
              M
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-foreground">
              MeterMint
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-foreground">
            <Link href="#metrics">Metrics</Link>
            <Link href="#features">Features</Link>
            <Link href="#terminal">CLI</Link>
            <Link href="#faq">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" size="md">
              Login
            </Button>
            <Button variant="default" size="md">
              Get Started
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <Button 
            onClick={() => setMenuOpen(!menuOpen)}
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t-4 border-foreground bg-white p-6 flex flex-col gap-4 font-semibold text-foreground">
            <Link href="#metrics" onClick={() => setMenuOpen(false)} className="py-2">Metrics</Link>
            <Link href="#features" onClick={() => setMenuOpen(false)} className="py-2">Features</Link>
            <Link href="#terminal" onClick={() => setMenuOpen(false)} className="py-2">CLI</Link>
            <Link href="#faq" onClick={() => setMenuOpen(false)} className="py-2">FAQ</Link>
            <div className="flex flex-col gap-3 pt-4 border-t-2 border-muted">
              <Button variant="outline" size="md" className="w-full">
                Login
              </Button>
              <Button variant="default" size="md" className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-white py-20 px-6 border-b-8 border-foreground">
        {/* Geometric Background Shapes */}
        <div className="absolute top-12 left-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-lg rotate-12 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex bg-accent text-foreground px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider self-start">
              v1.0 is Live
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              MeterMint Dashboard
            </h1>
            <p className="text-lg md:text-xl font-normal opacity-90 max-w-xl">
              High-performance API metering, rate limiting, and real-time usage-based billing instrumentation for modern SaaS platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button 
                variant="default" 
                size="lg" 
                className="bg-accent hover:bg-accent-hover text-foreground border-0"
                rightIcon={<ArrowRight size={20} />}
              >
                Access Console
              </Button>
              <Button variant="whiteOutline" size="lg">
                Read API Reference
              </Button>
            </div>
          </div>

          {/* Graphical composition representing data dashboard */}
          <div className="relative aspect-video bg-foreground border-4 border-white rounded-lg p-6 flex flex-col justify-between overflow-hidden shadow-none">
            <div className="flex items-center justify-between border-b-2 border-white/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-green-500 inline-block" />
                <span className="text-xs text-white/50 font-mono ml-2">metermint-cli v1.0.0</span>
              </div>
              <span className="text-xs text-secondary font-bold">CONNECTED</span>
            </div>
            
            <div className="flex-1 font-mono text-sm text-emerald-400 py-6 overflow-y-auto flex flex-col gap-2">
              <p className="text-white/40">&gt; metermint listen --org-id org_01j4v</p>
              <p className="text-white">&gt; [INFO] Listening for billing events on US_EAST...</p>
              <p>&gt; [EVENT] event_id=evt_9831a org_id=org_01j4v cost=$0.0024 OK</p>
              <p>&gt; [EVENT] event_id=evt_9831b org_id=org_01j4v cost=$0.0051 OK</p>
              <p className="text-accent">&gt; [ALERT] Organization org_01j4v reached 80% usage limit</p>
              <p>&gt; [EVENT] event_id=evt_9831c org_id=org_01j4v cost=$0.0012 OK</p>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-md font-mono text-xs text-white/70">
              <span>LATENCY: 4.2ms</span>
              <span>EVENTS INGESTED: 45,201,894</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section (White vs Muted alternating blocks) */}
      <section id="metrics" className="bg-muted py-20 px-6 border-b-4 border-foreground">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
              Real-time Ingest Metrics
            </h2>
            <p className="text-lg text-foreground/75 max-w-2xl mx-auto">
              Track usage metrics in real-time. MeterMint&apos;s ingestion pipeline validates and routes usage events instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
            {/* Active Keys Card */}
            <Card variant="blue" isLink className="flex flex-col gap-6">
              <div className="h-14 w-14 rounded-full bg-white text-primary flex items-center justify-center border-2 border-foreground transition-transform duration-200 group-hover:scale-110">
                <Key size={24} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Authentication</span>
                <h3 className="text-4xl font-extrabold text-foreground mt-2">1,240</h3>
                <p className="text-foreground/70 mt-2 font-medium">Active API credentials actively registering metrics.</p>
              </div>
            </Card>

            {/* Total Ingress Card */}
            <Card variant="emerald" isLink className="flex flex-col gap-6">
              <div className="h-14 w-14 rounded-full bg-white text-secondary flex items-center justify-center border-2 border-foreground transition-transform duration-200 group-hover:scale-110">
                <Activity size={24} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-sm font-bold text-secondary uppercase tracking-wider">Ingress</span>
                <h3 className="text-4xl font-extrabold text-foreground mt-2">45.2M</h3>
                <p className="text-foreground/70 mt-2 font-medium">Requests ingested and validated within the last 24 hours.</p>
              </div>
            </Card>

            {/* Estimated Billing Card */}
            <Card variant="amber" isLink className="flex flex-col gap-6">
              <div className="h-14 w-14 rounded-full bg-white text-accent flex items-center justify-center border-2 border-foreground transition-transform duration-200 group-hover:scale-110">
                <DollarSign size={24} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-sm font-bold text-accent uppercase tracking-wider">Revenue</span>
                <h3 className="text-4xl font-extrabold text-foreground mt-2">$12,543</h3>
                <p className="text-foreground/70 mt-2 font-medium">Accrued billable volume generated dynamically across clusters.</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20 px-6 border-b-4 border-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
              Confident Design System, Hardened Architecture
            </h2>
            <p className="text-lg text-foreground/75 leading-relaxed">
              MeterMint decouples event ingestion from complex database updates. Our core framework enforces exact multi-tenant isolation, deterministic billing logic, and instant ingestion response using background workers.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-md bg-secondary text-white flex items-center justify-center shrink-0 border-2 border-foreground">
                  <Shield size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">Tenant Sandboxing</h4>
                  <p className="text-foreground/70 mt-1">Tenant context derived via verified API keys. Data structures partitioned at the storage layer.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-md bg-primary text-white flex items-center justify-center shrink-0 border-2 border-foreground">
                  <Zap size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">Under 5ms Response</h4>
                  <p className="text-foreground/70 mt-1">Events dropped into high-throughput Redis-backed message queues for processing.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card variant="default" className="bg-primary/5 border-2 border-primary/20 p-6 flex flex-col gap-3">
              <span className="text-3xl font-extrabold text-primary">99.99%</span>
              <span className="font-bold text-sm text-foreground">Ingress SLA</span>
            </Card>
            <Card variant="default" className="bg-secondary/5 border-2 border-secondary/20 p-6 flex flex-col gap-3">
              <span className="text-3xl font-extrabold text-secondary">&lt; 10ms</span>
              <span className="font-bold text-sm text-foreground">Ingestion P99</span>
            </Card>
            <Card variant="default" className="bg-accent/5 border-2 border-accent/20 p-6 flex flex-col gap-3">
              <span className="text-3xl font-extrabold text-accent">100%</span>
              <span className="font-bold text-sm text-foreground">Idempotent</span>
            </Card>
            <Card variant="default" className="bg-foreground/5 border-2 border-foreground/20 p-6 flex flex-col gap-3">
              <span className="text-3xl font-extrabold text-foreground">Zero</span>
              <span className="font-bold text-sm text-foreground">Rounding Errors</span>
            </Card>
          </div>
        </div>
      </section>

      {/* Terminal Block Section */}
      <section id="terminal" className="bg-foreground text-white py-20 px-6 border-b-4 border-foreground relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <h2 className="text-4xl font-extrabold tracking-tight">API Command Line Interface</h2>
            <p className="text-white/70 max-w-xl">
              Query status, fetch organizations, or trigger test runs in seconds directly from the CLI.
            </p>
          </div>

          <Card variant="darkSlate" className="font-mono text-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Terminal size={18} className="text-primary" />
              <span className="text-xs text-white/50">curl metermint-api</span>
            </div>
            <div className="text-emerald-400 select-all overflow-x-auto whitespace-nowrap py-2">
              curl -H &quot;x-api-key: mm_live_831ab00fd&quot; http://localhost:4000/api/health
            </div>
            <div className="text-white/60">
              <p>&#123;</p>
              <p className="pl-4">&quot;status&quot;: &quot;healthy&quot;,</p>
              <p className="pl-4">&quot;timestamp&quot;: &quot;{new Date().toISOString()}&quot;,</p>
              <p className="pl-4">&quot;queue&quot;: &#123; &quot;activeWorkers&quot;: 4, &quot;pendingJobs&quot;: 0 &#125;</p>
              <p>&#125;</p>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white py-20 px-6 border-b-4 border-foreground">
        <div className="max-w-3xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight text-center">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-6">
            <Card variant="muted" className="border-2 border-foreground">
              <h3 className="text-lg font-bold text-foreground">How does usage metering keep events in order?</h3>
              <p className="text-foreground/75 mt-2">
                All events supply a client-generated ID. We deduplicate events based on the organization and event identifiers, preventing double-billing or ordering errors.
              </p>
            </Card>

            <Card variant="muted" className="border-2 border-foreground">
              <h3 className="text-lg font-bold text-foreground">What happens under heavy API usage bursts?</h3>
              <p className="text-foreground/75 mt-2">
                The ingestion API validates the format, drops the event in a Redis queue, and answers immediately. Background workers handle processing in a rate-controlled, batch-wise manner.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-md border border-white text-white font-extrabold text-lg">
              M
            </div>
            <span className="font-extrabold text-xl tracking-tight">MeterMint</span>
          </div>

          <p className="text-sm text-white/50 font-mono">
            &copy; {new Date().getFullYear()} MeterMint, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="#" className="text-white/70 hover:text-white">Privacy</Link>
            <Link href="#" className="text-white/70 hover:text-white">Terms</Link>
            <Link href="#" className="text-white/70 hover:text-white">Github</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
