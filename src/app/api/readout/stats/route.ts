import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Overall totals from email_events
  const { data: events } = await supabase
    .from('email_events')
    .select('event_type, broadcast_id, flow_id');

  const totals = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
  const broadcastMap: Record<string, typeof totals> = {};

  for (const e of events || []) {
    const t = e.event_type as keyof typeof totals;
    if (t in totals) totals[t]++;

    if (e.broadcast_id) {
      if (!broadcastMap[e.broadcast_id]) {
        broadcastMap[e.broadcast_id] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      }
      if (t in broadcastMap[e.broadcast_id]) broadcastMap[e.broadcast_id][t]++;
    }
  }

  const broadcastStats = Object.entries(broadcastMap).map(([broadcast_id, stats]) => ({
    broadcast_id,
    ...stats,
  }));

  // Last 30 days trend: daily open counts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentOpens } = await supabase
    .from('email_events')
    .select('created_at')
    .eq('event_type', 'opened')
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Group by date
  const dailyOpens: Record<string, number> = {};
  for (const e of recentOpens || []) {
    const day = e.created_at.slice(0, 10);
    dailyOpens[day] = (dailyOpens[day] || 0) + 1;
  }

  return NextResponse.json({
    totals,
    broadcastStats,
    dailyOpens,
  });
}
