import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flowId } = await params;

  const { data: enrollments, error } = await supabase
    .from('flow_enrollments')
    .select('id, lead_id, prospect_id, current_step_index, next_send_at, status, created_at')
    .eq('flow_id', flowId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (!enrollments?.length) return NextResponse.json({ success: true, data: [] });

  const leadIds = enrollments.map(e => e.lead_id).filter(Boolean);
  const prospectIds = enrollments.map(e => e.prospect_id).filter(Boolean);

  const [{ data: leads }, { data: prospects }] = await Promise.all([
    leadIds.length
      ? supabase.from('leads').select('id, name, email').in('id', leadIds)
      : Promise.resolve({ data: [] }),
    prospectIds.length
      ? supabase.from('prospects').select('id, name, email, company').in('id', prospectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const leadsMap = Object.fromEntries((leads || []).map(l => [l.id, l]));
  const prospectsMap = Object.fromEntries((prospects || []).map(p => [p.id, p]));

  const data = enrollments.map(e => ({
    ...e,
    lead: e.lead_id ? (leadsMap[e.lead_id] || null) : null,
    prospect: e.prospect_id ? (prospectsMap[e.prospect_id] || null) : null,
  }));

  return NextResponse.json({ success: true, data });
}
