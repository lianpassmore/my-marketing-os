"use client";

import { useState } from 'react';
import { Globe, CreditCard, Key, X, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

// ─── DNS Modal ──────────────────────────────────────────────────────────────

function DNSModal({ onClose }: { onClose: () => void }) {
  const records = [
    { type: 'TXT', name: '@', value: 'v=spf1 include:amazonses.com ~all', purpose: 'SPF — authorises Resend to send on your behalf' },
    { type: 'CNAME', name: 'resend._domainkey', value: 'resend._domainkey.resend.com', purpose: 'DKIM — cryptographically signs your emails' },
    { type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com', purpose: 'DMARC — protects against spoofing' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
          <div>
            <h2 className="text-base font-semibold text-content-ink">Configure Sending Domain</h2>
            <p className="text-xs text-content-slate mt-0.5">Add these DNS records at your domain registrar, then verify in Resend.</p>
          </div>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {records.map((rec, i) => (
            <div key={i} className="border border-surface-mist rounded-lg overflow-hidden">
              <div className="bg-surface-cloud px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-content-slate uppercase tracking-wider">{rec.type} Record</span>
                <span className="text-xs text-content-slate">{rec.purpose}</span>
              </div>
              <div className="p-4 grid grid-cols-[80px_1fr] gap-y-2 text-sm">
                <span className="text-content-slate font-medium">Name</span>
                <code className="font-mono text-content-ink bg-surface-cloud px-2 py-0.5 rounded text-xs">{rec.name}</code>
                <span className="text-content-slate font-medium">Value</span>
                <code className="font-mono text-content-ink bg-surface-cloud px-2 py-0.5 rounded text-xs break-all">{rec.value}</code>
              </div>
            </div>
          ))}

          <div className="bg-brand-glow/50 border border-brand-storm/20 rounded-lg p-4 text-sm text-content-slate">
            DNS changes can take up to 48 hours to propagate. Once added, verify your domain directly in the Resend dashboard.
          </div>

          <div className="flex justify-end">
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open Resend Dashboard
              <ExternalLink size={14} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Section Card ──────────────────────────────────────────────────

function Section({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-surface-mist flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-cloud rounded-lg flex items-center justify-center text-brand-storm shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-content-ink">{title}</h2>
          <p className="text-xs text-content-slate mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [showDNS, setShowDNS] = useState(false);
  const [billingClicked, setBillingClicked] = useState(false);

  const handleBilling = () => {
    setBillingClicked(true);
    setTimeout(() => setBillingClicked(false), 3000);
  };

  return (
    <main className="p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content-ink">Settings</h1>
        <p className="text-content-slate mt-1 text-sm">Configure your sending domain, billing, and account details.</p>
      </header>

      <div className="space-y-6">

        {/* Sending Domain */}
        <Section
          icon={<Globe size={18} />}
          title="Sending Domain"
          description="Authenticate a custom domain so emails land in inboxes, not spam."
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <CheckCircle size={14} />
                Configured
              </div>
              <span className="text-sm text-content-slate">Sending from <code className="text-xs bg-surface-cloud px-1.5 py-0.5 rounded">lian@yourhq.co.nz</code></span>
            </div>
            <button
              onClick={() => setShowDNS(true)}
              className="px-4 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors flex items-center"
            >
              <Globe size={15} className="mr-2" />
              Manage DNS
            </button>
          </div>
          <p className="text-xs text-content-slate mt-4">
            Make sure <code className="bg-surface-cloud px-1 rounded">yourhq.co.nz</code> is verified in your Resend dashboard for emails to deliver successfully.
          </p>
        </Section>

        {/* Billing */}
        <Section
          icon={<CreditCard size={18} />}
          title="Billing"
          description="Manage your plan and payment details."
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-content-ink">Free Plan</span>
                <span className="text-xs bg-surface-cloud border border-surface-mist text-content-slate px-2 py-0.5 rounded-full">Current</span>
              </div>
              <p className="text-sm text-content-slate">3,000 emails / month · 1 sending domain</p>
            </div>
            <div className="flex items-center gap-3">
              {billingClicked && (
                <span className="text-xs text-green-600 flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={14} />
                  Stripe coming soon
                </span>
              )}
              <button
                onClick={handleBilling}
                className="px-4 py-2 bg-surface-paper border border-surface-mist hover:bg-surface-cloud text-content-ink text-sm font-medium rounded-lg transition-colors flex items-center"
              >
                <CreditCard size={15} className="mr-2 text-content-slate" />
                Manage Billing
              </button>
            </div>
          </div>
        </Section>

        {/* API Keys / Account */}
        <Section
          icon={<Key size={18} />}
          title="API Keys"
          description="Environment variables required by Signal by DreamStorm."
        >
          <div className="space-y-3">
            {[
              { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'Your Supabase project URL' },
              { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Supabase anonymous key for client-side calls' },
              { key: 'ANTHROPIC_API_KEY', desc: 'Powers the Sabri Suby AI copy engine' },
              { key: 'RESEND_API_KEY', desc: 'Sends transactional and broadcast emails' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-start justify-between py-3 border-b border-surface-mist last:border-0">
                <div>
                  <code className="text-xs font-mono bg-surface-cloud border border-surface-mist px-2 py-1 rounded text-content-ink">{key}</code>
                  <p className="text-xs text-content-slate mt-1">{desc}</p>
                </div>
                <span className="text-xs text-green-600 flex items-center gap-1 shrink-0 ml-4 mt-1">
                  <CheckCircle size={13} />
                  Set via .env
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-content-slate mt-4">
            Store these in your <code className="bg-surface-cloud px-1 rounded">.env.local</code> file. Never commit them to version control.
          </p>
        </Section>

      </div>

      {showDNS && <DNSModal onClose={() => setShowDNS(false)} />}
    </main>
  );
}
