import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNextSendAt } from '@/lib/tokens';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flowId } = await params;
  const body = await request.json();
  const { lead_id, prospect_id } = body;

  if (!lead_id && !prospect_id) {
    return NextResponse.json({ success: false, error: 'lead_id or prospect_id required' }, { status: 400 });
  }

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

  // Build enrollment payload — only set the relevant id
  const enrollmentPayload = prospect_id
    ? {
        flow_id: flowId,
        prospect_id,
        lead_id: null,
        current_step_index: 0,
        next_send_at: nextSendAt.toISOString(),
        status: 'active',
      }
    : {
        flow_id: flowId,
        lead_id,
        current_step_index: 0,
        next_send_at: nextSendAt.toISOString(),
        status: 'active',
      };

  const conflictColumn = prospect_id ? 'flow_id,prospect_id' : 'flow_id,lead_id';

  const { data, error } = await supabase
    .from('flow_enrollments')
    .upsert([enrollmentPayload], { onConflict: conflictColumn })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
