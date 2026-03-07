import { supabase } from '@/lib/supabase';
import { Activity, Users, Send, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function Dashboard() {
  const [leadsRes, leadsCountRes, broadcastsRes, eventsRes] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('broadcasts').select('id, status').eq('status', 'sent'),
    supabase.from('email_events').select('event_type'),
  ]);

  const leads = leadsRes.data || [];
  const totalLeads = leadsCountRes.count || 0;
  const broadcastsSent = broadcastsRes.data?.length || 0;
  const events = eventsRes.data || [];

  const sentCount = events.filter(e => e.event_type === 'sent').length;
  const bouncedCount = events.filter(e => e.event_type === 'bounced').length;
  const openedCount = events.filter(e => e.event_type === 'opened').length;
  const bounceRate = sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0;
  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : null;

  const signalStatus = bounceRate > 2 ? 'At Risk' : bounceRate > 0.5 ? 'Monitor' : 'Excellent';
  const signalColor = bounceRate > 2 ? 'text-red-600 bg-red-50' : bounceRate > 0.5 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
  const barColor = bounceRate > 2 ? 'bg-red-500' : bounceRate > 0.5 ? 'bg-amber-400' : 'bg-green-500';

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Welcome back, Founder</h1>
          <p className="text-content-slate mt-1 text-sm">Here is what is happening across your audience today.</p>
        </div>
        <Link href="/broadcasts/new" className="bg-brand-storm hover:bg-brand-indigo text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
          <Plus size={18} className="mr-2" />
          Create Broadcast
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Audience" value={totalLeads.toString()} icon={<Users size={20} />} />
        <StatCard
          title="Broadcasts Sent (all time)"
          value={broadcastsSent.toString()}
          icon={<Send size={20} />}
          trend={openRate !== null ? `${openRate}% avg open rate` : undefined}
        />

        <div className="bg-surface-paper p-6 rounded-xl border border-surface-mist shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-content-slate">Signal Health</h3>
            <div className={`p-2 rounded-md ${signalColor}`}>
              {bounceRate > 2 ? <AlertTriangle size={20} /> : <Activity size={20} />}
            </div>
          </div>
          <p className="text-2xl font-semibold text-content-ink">{signalStatus}</p>
          <p className="text-xs text-content-slate mt-2">
            {sentCount > 0
              ? `Bounce rate ${bounceRate.toFixed(1)}% · ${sentCount} emails sent`
              : 'Domain authenticated · awaiting first send'}
          </p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-surface-cloud">
            <div className={`h-full rounded-r-full shadow-sm ${barColor}`} style={{ width: bounceRate > 2 ? '100%' : bounceRate > 0.5 ? '50%' : '70%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-paper rounded-xl border border-surface-mist shadow-sm">
          <div className="p-6 border-b border-surface-mist flex justify-between items-center">
            <h2 className="text-base font-semibold text-content-ink">Recent Audience Activity</h2>
            <Link href="/audience" className="text-sm text-brand-storm font-medium hover:text-brand-indigo flex items-center">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="p-0">
            {leads.length > 0 ? (
              <ul className="divide-y divide-surface-mist">
                {leads.map((lead) => (
                  <li key={lead.id} className="p-6 flex justify-between items-center hover:bg-surface-cloud transition-colors">
                    <div>
                      <p className="text-sm font-medium text-content-ink">{lead.name}</p>
                      <p className="text-xs text-content-slate mt-1">{lead.email}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-glow text-brand-storm">
                      {lead.source || 'New Subscriber'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-surface-cloud rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-content-slate" size={24} />
                </div>
                <h3 className="text-sm font-medium text-content-ink">No contacts yet</h3>
                <p className="text-sm text-content-slate mt-1 mb-4">Import your list to start sending signals.</p>
                <Link href="/audience" className="text-sm font-medium text-brand-storm hover:text-brand-indigo">Import CSV</Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-paper rounded-xl border border-surface-mist shadow-sm p-6 h-fit">
          <h2 className="text-base font-semibold text-content-ink mb-6">Next Steps</h2>
          <div className="space-y-4">
            <ActionItem title="Setup Sender Profile" desc="Verify your sending domain" done={false} />
            <ActionItem title="Create a Blueprint" desc="Set up your Light & Shade templates" done={false} />
            <ActionItem title="Import Contacts" desc="Upload your CSV or connect forms" done={totalLeads > 0} />
            <ActionItem title="Activate a Flow" desc="Turn on your first drip sequence" done={false} />
            <ActionItem title="Send a Broadcast" desc="Fire your first signal" done={broadcastsSent > 0} />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <div className="bg-surface-paper p-6 rounded-xl border border-surface-mist shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-content-slate">{title}</h3>
        <div className="p-2 bg-surface-cloud text-content-slate rounded-md">{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-content-ink">{value}</p>
      {trend && <p className="text-xs text-brand-storm mt-2 font-medium">{trend}</p>}
    </div>
  );
}

function ActionItem({ title, desc, done }: { title: string; desc: string; done: boolean }) {
  return (
    <div className="flex items-start">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${done ? 'bg-green-500 border-green-500' : 'border-surface-mist bg-surface-cloud'}`}>
        {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <div className="ml-3">
        <p className={`text-sm font-medium ${done ? 'text-content-slate line-through' : 'text-content-ink'}`}>{title}</p>
        <p className="text-xs text-content-slate mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
