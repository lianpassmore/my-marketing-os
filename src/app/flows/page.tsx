"use client";

import { useEffect, useState } from 'react';
import { Workflow, Plus, Zap, Clock, Play, Pause, Trash2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

type Flow = {
  id: string;
  name: string;
  trigger_type: string;
  trigger_tag?: string;
  status: 'draft' | 'active' | 'paused';
  send_days: string[];
  send_time: string;
  created_at: string;
};

const statusColors = {
  draft: 'bg-surface-cloud text-content-slate border-surface-mist',
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/flows');
      const { data } = await res.json();
      setFlows(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFlows(); }, []);

  const toggleStatus = async (flow: Flow) => {
    const newStatus = flow.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/flows/${flow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, status: newStatus } : f));
  };

  const deleteFlow = async (id: string) => {
    if (!confirm('Delete this flow? This will stop all active enrollments.')) return;
    await fetch(`/api/flows/${id}`, { method: 'DELETE' });
    setFlows(prev => prev.filter(f => f.id !== id));
  };

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Flows</h1>
          <p className="text-content-slate mt-1 text-sm">Automate your sequences. Set up Light & Shade drip campaigns.</p>
        </div>
        <Link
          href="/flows/new"
          className="bg-brand-storm hover:bg-brand-indigo text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create Flow
        </Link>
      </header>

      {/* Recommended Templates */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-content-slate uppercase tracking-wider mb-4">Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Link href="/flows/new?template=nurture" className="group bg-surface-paper border border-surface-mist rounded-xl p-5 hover:border-brand-storm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-brand-glow rounded-lg flex items-center justify-center">
                <Zap className="text-brand-storm" size={20} />
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist flex items-center">
                  <Clock size={10} className="mr-1" />10 emails
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist">15 days</span>
              </div>
            </div>
            <h3 className="font-semibold text-content-ink mb-1.5 group-hover:text-brand-storm transition-colors">Magic Lantern Nurture Flow</h3>
            <p className="text-sm text-content-slate leading-relaxed mb-3">Full HVCO delivery → value education → Godfather offer. Converts cold leads into buyers.</p>
            <span className="text-xs font-medium text-brand-storm group-hover:underline">Open in Flow Builder →</span>
          </Link>

          <Link href="/flows/new?template=reengage" className="group bg-surface-paper border border-surface-mist rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <RefreshCw className="text-amber-600" size={20} />
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist flex items-center">
                  <Clock size={10} className="mr-1" />3 emails
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist">5 days</span>
              </div>
            </div>
            <h3 className="font-semibold text-content-ink mb-1.5 group-hover:text-amber-600 transition-colors">Re-engagement Win-Back</h3>
            <p className="text-sm text-content-slate leading-relaxed mb-3">Auto-triggers for subscribers inactive 30+ days. Segments out the truly cold leads.</p>
            <span className="text-xs font-medium text-amber-600 group-hover:underline">Open in Flow Builder →</span>
          </Link>

          <Link href="/flows/new?template=postpurchase" className="group bg-surface-paper border border-surface-mist rounded-xl p-5 hover:border-green-400 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <ShieldAlert className="text-green-600" size={20} />
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist flex items-center">
                  <Clock size={10} className="mr-1" />4 emails
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-surface-cloud rounded-full text-content-slate border border-surface-mist">10 days</span>
              </div>
            </div>
            <h3 className="font-semibold text-content-ink mb-1.5 group-hover:text-green-600 transition-colors">Post-Purchase Onboarding</h3>
            <p className="text-sm text-content-slate leading-relaxed mb-3">Welcome → quick win → tips → upsell. Triggers on the &quot;Customer&quot; tag. Reduces churn, increases LTV.</p>
            <span className="text-xs font-medium text-green-600 group-hover:underline">Open in Flow Builder →</span>
          </Link>
        </div>
      </section>

      {/* Your Flows */}
      <section>
        <h2 className="text-xs font-bold text-content-slate uppercase tracking-wider mb-4">Your Flows</h2>

        {isLoading ? (
          <div className="bg-surface-paper border border-surface-mist rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-content-slate" size={24} />
          </div>
        ) : flows.length === 0 ? (
          <div className="bg-surface-paper border border-surface-mist rounded-xl flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 bg-surface-cloud rounded-full flex items-center justify-center mx-auto mb-4">
              <Workflow className="text-content-slate" size={24} />
            </div>
            <h3 className="text-sm font-medium text-content-ink mb-1">No flows saved yet</h3>
            <p className="text-sm text-content-slate">Start from a template above or build a custom flow.</p>
          </div>
        ) : (
          <div className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-cloud border-b border-surface-mist text-content-slate text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Flow Name</th>
                  <th className="px-6 py-3 font-medium">Trigger</th>
                  <th className="px-6 py-3 font-medium">Schedule</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-mist">
                {flows.map(flow => (
                  <tr key={flow.id} className="hover:bg-surface-cloud transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/flows/new?id=${flow.id}`} className="font-medium text-content-ink hover:text-brand-storm transition-colors">
                        {flow.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-content-slate">
                      {flow.trigger_type === 'tag' ? `Tag: ${flow.trigger_tag || '—'}` :
                       flow.trigger_type === 'new_contact' ? 'New Contact' :
                       flow.trigger_type === 'post_purchase' ? 'Post-Purchase' : 'Manual'}
                    </td>
                    <td className="px-6 py-4 text-content-slate text-xs">
                      {flow.send_days?.map(d => d.slice(0,3)).join(', ')} · {flow.send_time}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColors[flow.status]}`}>
                        {flow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(flow)}
                          className="p-1.5 rounded hover:bg-surface-mist transition-colors text-content-slate hover:text-content-ink"
                          title={flow.status === 'active' ? 'Pause flow' : 'Activate flow'}
                        >
                          {flow.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                        <button
                          onClick={() => deleteFlow(flow.id)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors text-content-slate hover:text-red-500"
                          title="Delete flow"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
