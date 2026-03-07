"use client";

import { useEffect, useState } from 'react';
import { Radio, Plus, Loader2, Send, BarChart2 } from 'lucide-react';
import Link from 'next/link';

type Broadcast = {
  id: string;
  subject: string;
  framework?: string;
  status: 'draft' | 'sending' | 'sent';
  recipient_count: number;
  sent_at?: string;
  created_at: string;
  ab_subject_b?: string;
  is_plain_text?: boolean;
};

type BroadcastStats = {
  broadcast_id: string;
  opens: number;
  clicks: number;
  sent: number;
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState<Record<string, BroadcastStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [bRes, sRes] = await Promise.all([
          fetch('/api/broadcasts'),
          fetch('/api/readout/stats'),
        ]);
        const { data: bData } = await bRes.json();
        setBroadcasts(bData || []);

        if (sRes.ok) {
          const { broadcastStats } = await sRes.json();
          const map: Record<string, BroadcastStats> = {};
          (broadcastStats || []).forEach((s: BroadcastStats) => { map[s.broadcast_id] = s; });
          setStats(map);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const sendBroadcast = async (id: string) => {
    if (!confirm('Send this broadcast to your full audience now?')) return;
    setSending(id);
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' });
      const { success, sent } = await res.json();
      if (success) {
        setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, status: 'sent', recipient_count: sent } : b));
      } else {
        alert('Send failed. Check console.');
      }
    } finally {
      setSending(null);
    }
  };

  const openRate = (id: string) => {
    const s = stats[id];
    if (!s || !s.sent) return '—';
    return `${Math.round((s.opens / s.sent) * 100)}%`;
  };

  const clickRate = (id: string) => {
    const s = stats[id];
    if (!s || !s.sent) return '—';
    return `${Math.round((s.clicks / s.sent) * 100)}%`;
  };

  return (
    <main className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Broadcasts</h1>
          <p className="text-content-slate mt-1 text-sm">Send one-off campaigns and updates to your audience.</p>
        </div>
        <Link href="/broadcasts/new" className="bg-brand-storm hover:bg-brand-indigo text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
          <Plus size={18} className="mr-2" />
          New Broadcast
        </Link>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-content-slate" size={28} />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="flex-1 bg-surface-paper border border-surface-mist rounded-xl shadow-sm flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-surface-cloud rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Radio className="text-brand-storm" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-content-ink mb-2">No broadcasts yet</h2>
          <p className="text-content-slate max-w-md mx-auto mb-8">
            Create a blueprint, generate your copy with AI, then save it as a broadcast.
          </p>
          <Link href="/broadcasts/new" className="bg-brand-storm hover:bg-brand-indigo text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
            Create your first Broadcast
          </Link>
        </div>
      ) : (
        <div className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-cloud border-b border-surface-mist text-content-slate text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sent To</th>
                <th className="px-6 py-3 font-medium flex items-center gap-1"><BarChart2 size={12} /> Opens</th>
                <th className="px-6 py-3 font-medium">Clicks</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-mist">
              {broadcasts.map(b => (
                <tr key={b.id} className="hover:bg-surface-cloud transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-content-ink">{b.subject}</div>
                    {b.ab_subject_b && (
                      <div className="text-xs text-purple-600 mt-0.5">A/B · B: {b.ab_subject_b}</div>
                    )}
                    {b.is_plain_text && (
                      <span className="text-xs text-content-slate mt-0.5 inline-block">Plain text</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      b.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                      b.status === 'sending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-surface-cloud text-content-slate border-surface-mist'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-content-slate">{b.recipient_count || '—'}</td>
                  <td className="px-6 py-4 font-medium text-content-ink">{openRate(b.id)}</td>
                  <td className="px-6 py-4 font-medium text-content-ink">{clickRate(b.id)}</td>
                  <td className="px-6 py-4 text-content-slate text-xs">
                    {b.sent_at
                      ? new Date(b.sent_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })
                      : new Date(b.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {b.status === 'draft' && (
                      <button
                        onClick={() => sendBroadcast(b.id)}
                        disabled={sending === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-storm hover:bg-brand-indigo text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                      >
                        {sending === b.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
