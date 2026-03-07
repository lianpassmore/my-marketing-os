import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flowId } = await params;

  const { data: enrollments, error } = await supabase
    .from('flow_enrollments')
    .select('id, lead_id, current_step_index, next_send_at, status, created_at')
    .eq('flow_id', flowId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (!enrollments?.length) return NextResponse.json({ success: true, data: [] });

  const leadIds = enrollments.map(e => e.lead_id);
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email')
    .in('id', leadIds);

  const leadsMap = Object.fromEntries((leads || []).map(l => [l.id, l]));

  const data = enrollments.map(e => ({
    ...e,
    lead: leadsMap[e.lead_id] || null,
  }));

  return NextResponse.json({ success: true, data });
}
