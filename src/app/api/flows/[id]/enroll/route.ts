import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNextSendAt } from '@/lib/tokens';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flowId } = await params;
  const { lead_id } = await request.json();

  // Fetch flow to get scheduling prefs
  const { data: flow, error: flowErr } = await supabase
    .from('flows')
    .select('send_days, send_time, nodes')
    .eq('id', flowId)
    .single();

  if (flowErr || !flow) {
    return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });
  }

  const nextSendAt = getNextSendAt(0, flow.send_days || ['tuesday', 'thursday'], flow.send_time || '10:00');

  const { data, error } = await supabase
    .from('flow_enrollments')
    .upsert([{
      flow_id: flowId,
      lead_id,
      current_step_index: 0,
      next_send_at: nextSendAt.toISOString(),
      status: 'active',
    }], { onConflict: 'flow_id,lead_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
