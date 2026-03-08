"use client";

import { useEffect, useState } from 'react';
import { BarChart3, Mail, MousePointerClick, ShieldCheck, AlertTriangle, Loader2, TrendingUp, UserMinus } from 'lucide-react';

type Totals = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
};

type BroadcastStat = {
  broadcast_id: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
};

type FlowStat = {
  flow_id: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
};

type Broadcast = {
  id: string;
  subject: string;
  sent_at?: string;
  recipient_count: number;
};

type Flow = {
  id: string;
  name: string;
};

function pct(num: number, denom: number): string {
  if (!denom) return '—';
  return `${Math.round((num / denom) * 100)}%`;
}

// Open rate excludes the first 10 sends (untrackable)
function openPct(opened: number, sent: number): string {
  const trackable = sent - 10;
  if (trackable <= 0) return '—';
  return `${Math.round((opened / trackable) * 100)}%`;
}

function StatTile({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: 'green' | 'red' | 'blue' | 'default';
}) {
  const colors = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-500 bg-red-50',
    blue: 'text-brand-storm bg-brand-glow',
    default: 'text-content-slate bg-surface-cloud',
  };
  const cls = colors[accent || 'default'];
  return (
    <div className="bg-surface-paper border border-surface-mist rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-medium text-content-slate uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${cls}`}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-content-ink">{value}</p>
      {sub && <p className="text-xs text-content-slate mt-1">{sub}</p>}
    </div>
  );
}

export default function ReadoutPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStat[]>([]);
  const [flowStats, setFlowStats] = useState<FlowStat[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [dailyOpens, setDailyOpens] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [statsRes, bRes, fRes] = await Promise.all([
          fetch('/api/readout/stats'),
          fetch('/api/broadcasts'),
          fetch('/api/flows'),
        ]);
        if (statsRes.ok) {
          const { totals: t, broadcastStats: bs, flowStats: fs, dailyOpens: do_ } = await statsRes.json();
          setTotals(t);
          setBroadcastStats(bs || []);
          setFlowStats(fs || []);
          setDailyOpens(do_ || {});
        }
        if (bRes.ok) {
          const { data } = await bRes.json();
          setBroadcasts(data || []);
        }
        if (fRes.ok) {
          const { data } = await fRes.json();
          setFlows(data || []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const hasSent = (totals?.sent || 0) > 0;
  const openRate = openPct(totals?.opened || 0, totals?.sent || 0);
  const clickRate = pct(totals?.clicked || 0, totals?.sent || 0);
  const deliverRate = pct(totals?.delivered || 0, totals?.sent || 0);
  const bounceRate = pct(totals?.bounced || 0, totals?.sent || 0);
  const unsubRate = pct(totals?.unsubscribed || 0, totals?.sent || 0);

  const bounceNum = totals ? (totals.bounced / Math.max(totals.sent, 1)) * 100 : 0;
  const signalHealth = bounceNum > 2 ? 'At Risk' : bounceNum > 0.5 ? 'Watch' : 'Excellent';
  const signalAccent = bounceNum > 2 ? 'red' : bounceNum > 0.5 ? 'default' : 'green';

  // Build 30-day sparkline (last 30 days)
  const sparkDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const maxOpens = Math.max(...sparkDays.map(d => dailyOpens[d] || 0), 1);

  const getBroadcastInfo = (id: string) => broadcasts.find(b => b.id === id);
  const getFlowInfo = (id: string) => flows.find(f => f.id === id);

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content-ink">Readout</h1>
        <p className="text-content-slate mt-1 text-sm">Measure the signal. Track opens, clicks, and audience health.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-content-slate" size={28} />
        </div>
      ) : (
        <>
          {/* KPI tiles — only when there's data */}
          {hasSent && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatTile label="Open Rate" value={openRate} sub={`${totals?.opened} opens (first 10 excluded)`} icon={<Mail size={18} />} accent="blue" />
                <StatTile label="Click Rate" value={clickRate} sub={`${totals?.clicked} clicks`} icon={<MousePointerClick size={18} />} accent="blue" />
                <StatTile label="Deliverability" value={deliverRate} sub={`${totals?.delivered} delivered`} icon={<ShieldCheck size={18} />} accent="green" />
                <StatTile label="Unsub Rate" value={unsubRate} sub={`${totals?.unsubscribed} unsubscribed`} icon={<UserMinus size={18} />} accent={((totals?.unsubscribed || 0) / Math.max(totals?.sent || 1, 1)) > 0.01 ? 'red' : 'default'} />
                <StatTile
                  label="Signal Health"
                  value={signalHealth}
                  sub={`Bounce: ${bounceRate}`}
                  icon={bounceNum > 2 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                  accent={signalAccent as 'green' | 'red' | 'default'}
                />
              </div>

              {/* 30-day opens sparkline */}
              <div className="bg-surface-paper border border-surface-mist rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-brand-storm" />
                  <h2 className="text-sm font-semibold text-content-ink">Opens — Last 30 Days</h2>
                </div>
                <div className="flex items-end gap-0.5 h-20">
                  {sparkDays.map(day => {
                    const val = dailyOpens[day] || 0;
                    const heightPct = Math.round((val / maxOpens) * 100);
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center justify-end group relative">
                        <div
                          className="w-full bg-brand-storm/70 rounded-sm group-hover:bg-brand-storm transition-colors"
                          style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                        />
                        {val > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-content-ink text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {val}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-content-slate">
                  <span>{sparkDays[0]}</span>
                  <span>Today</span>
                </div>
              </div>
            </>
          )}

          {/* Flow Performance — always show if flows exist */}
          {flows.length > 0 && (
            <div className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-surface-mist">
                <h2 className="text-sm font-semibold text-content-ink">Flow Performance</h2>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-cloud text-content-slate text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Flow</th>
                    <th className="px-6 py-3 font-medium">Sent</th>
                    <th className="px-6 py-3 font-medium">Opens</th>
                    <th className="px-6 py-3 font-medium">Open Rate</th>
                    <th className="px-6 py-3 font-medium">Clicks</th>
                    <th className="px-6 py-3 font-medium">Unsubs</th>
                    <th className="px-6 py-3 font-medium">Bounces</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-mist">
                  {flows.map(f => {
                    const s = flowStats.find(fs => fs.flow_id === f.id);
                    return (
                      <tr key={f.id} className="hover:bg-surface-cloud transition-colors">
                        <td className="px-6 py-4 font-medium text-content-ink">{f.name}</td>
                        <td className="px-6 py-4 text-content-slate">{s?.sent ?? '—'}</td>
                        <td className="px-6 py-4 text-content-slate">{s?.opened ?? '—'}</td>
                        <td className="px-6 py-4">
                          {s ? (
                            <span className={`font-medium ${s.opened / Math.max(s.sent - 10, 1) > 0.2 ? 'text-green-600' : 'text-content-ink'}`}>
                              {openPct(s.opened, s.sent)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 text-content-slate">{s?.clicked ?? '—'}</td>
                        <td className="px-6 py-4 text-content-slate">{s?.unsubscribed ?? '—'}</td>
                        <td className="px-6 py-4">
                          {s ? (
                            <span className={s.bounced > 0 ? 'text-red-500 font-medium' : 'text-content-slate'}>
                              {s.bounced}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Broadcast Performance */}
          {broadcastStats.length > 0 && (
            <div className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-surface-mist">
                <h2 className="text-sm font-semibold text-content-ink">Broadcast Performance</h2>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-cloud text-content-slate text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Subject</th>
                    <th className="px-6 py-3 font-medium">Sent</th>
                    <th className="px-6 py-3 font-medium">Opens</th>
                    <th className="px-6 py-3 font-medium">Open Rate</th>
                    <th className="px-6 py-3 font-medium">Clicks</th>
                    <th className="px-6 py-3 font-medium">Bounces</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-mist">
                  {broadcastStats.map(s => {
                    const b = getBroadcastInfo(s.broadcast_id);
                    return (
                      <tr key={s.broadcast_id} className="hover:bg-surface-cloud transition-colors">
                        <td className="px-6 py-4 font-medium text-content-ink">{b?.subject || '—'}</td>
                        <td className="px-6 py-4 text-content-slate">{s.sent}</td>
                        <td className="px-6 py-4 text-content-slate">{s.opened}</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${s.opened / Math.max(s.sent - 10, 1) > 0.2 ? 'text-green-600' : 'text-content-ink'}`}>
                            {openPct(s.opened, s.sent)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-content-slate">{s.clicked}</td>
                        <td className="px-6 py-4">
                          <span className={s.bounced > 0 ? 'text-red-500 font-medium' : 'text-content-slate'}>
                            {s.bounced}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* True empty state — no flows and no sends */}
          {!hasSent && flows.length === 0 && (
            <div className="bg-surface-paper border border-surface-mist rounded-xl shadow-sm flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-surface-cloud rounded-full flex items-center justify-center mb-6 shadow-inner">
                <BarChart3 className="text-brand-storm" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-content-ink mb-2">Awaiting Data</h2>
              <p className="text-content-slate max-w-md mx-auto">
                Send your first broadcast or activate a flow to see performance metrics here.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
