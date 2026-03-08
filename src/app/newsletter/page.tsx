"use client";

import { useEffect, useState } from 'react';
import { Newspaper, Plus, Loader2, Send, BarChart2, Calendar } from 'lucide-react';
import Link from 'next/link';

type Issue = {
  id: string;
  subject: string;
  framework: string;
  status: 'draft' | 'sending' | 'sent';
  recipient_count: number;
  sent_at?: string;
  created_at: string;
};

type Stats = {
  broadcast_id: string;
  opens: number;
  clicks: number;
  sent: number;
};

export default function NewsletterPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
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
        const { data } = await bRes.json();
        setIssues((data || []).filter((b: Issue) => b.framework === 'newsletter'));

        if (sRes.ok) {
          const { broadcastStats } = await sRes.json();
          const map: Record<string, Stats> = {};
          (broadcastStats || []).forEach((s: Stats) => { map[s.broadcast_id] = s; });
          setStats(map);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const sendIssue = async (id: string) => {
    if (!confirm('Send this newsletter issue to your full audience now?')) return;
    setSending(id);
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' });
      const { success, sent } = await res.json();
      if (success) {
        setIssues(prev => prev.map(b => b.id === id ? { ...b, status: 'sent', recipient_count: sent } : b));
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="text-brand-storm" size={22} />
            <h1 className="text-2xl font-bold text-content-ink">Newsletter</h1>
          </div>
          <p className="text-sm text-content-slate">Your recurring publication. Consistent signal to your audience.</p>
        </div>
        <Link
          href="/newsletter/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-storm text-white rounded-lg text-sm font-medium hover:bg-brand-indigo transition-colors shadow-sm"
        >
          <Plus size={16} /> New Issue
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-content-slate" size={24} />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-24 bg-surface-paper rounded-xl border border-surface-mist">
          <div className="w-14 h-14 bg-brand-glow rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="text-brand-storm" size={24} />
          </div>
          <h3 className="text-base font-semibold text-content-ink mb-1">No issues yet</h3>
          <p className="text-sm text-content-slate mb-6">Write your first newsletter issue and build a recurring relationship with your audience.</p>
          <Link href="/newsletter/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-storm text-white rounded-lg text-sm font-medium hover:bg-brand-indigo transition-colors">
            <Plus size={15} /> Write First Issue
          </Link>
        </div>
      ) : (
        <div className="bg-surface-paper rounded-xl border border-surface-mist overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-mist text-xs font-semibold text-content-slate uppercase tracking-wider">
                <th className="text-left px-6 py-3">Issue</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Sent</th>
                <th className="text-right px-6 py-3">Opens</th>
                <th className="text-right px-6 py-3">Clicks</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-mist">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-surface-cloud transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-content-ink line-clamp-1">{issue.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-content-slate">
                      <Calendar size={13} />
                      {issue.sent_at ? formatDate(issue.sent_at) : formatDate(issue.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === 'sent'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : issue.status === 'sending'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-surface-cloud text-content-slate border border-surface-mist'
                    }`}>
                      {issue.status === 'sent' ? 'Sent' : issue.status === 'sending' ? 'Sending…' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-content-slate">
                    {issue.status === 'sent' ? issue.recipient_count.toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-content-slate">
                      <BarChart2 size={13} className="text-brand-storm" />
                      {openRate(issue.id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-content-slate">
                    {clickRate(issue.id)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {issue.status === 'draft' && (
                      <button
                        onClick={() => sendIssue(issue.id)}
                        disabled={sending === issue.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-storm text-white rounded-md text-xs font-medium hover:bg-brand-indigo disabled:opacity-50"
                      >
                        {sending === issue.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
