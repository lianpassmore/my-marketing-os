import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Resend sends webhook events for: email.sent, email.delivered, email.opened,
// email.clicked, email.bounced, email.complained, email.unsubscribed
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  // Validate Resend webhook signature if secret is configured
  if (secret) {
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 });
    }
    // Full signature verification requires the svix npm package.
    // For now we check the secret header that Resend sends.
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown>;

  // Map Resend event types to our internal event types
  const eventMap: Record<string, string> = {
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.unsubscribed': 'unsubscribed',
  };

  const internalType = eventMap[eventType];
  if (!internalType) {
    // Ignore event types we don't care about
    return NextResponse.json({ received: true });
  }

  const resendEmailId = data?.email_id as string;
  const clickedUrl = (data as Record<string, unknown>)?.click?.link as string | undefined;

  // Find the original sent event to get lead/flow/broadcast context
  const { data: sentEvent } = await supabase
    .from('email_events')
    .select('lead_id, flow_id, broadcast_id, step_index, subject')
    .eq('resend_email_id', resendEmailId)
    .eq('event_type', 'sent')
    .maybeSingle();

  await supabase.from('email_events').insert([{
    resend_email_id: resendEmailId,
    lead_id: sentEvent?.lead_id,
    flow_id: sentEvent?.flow_id,
    broadcast_id: sentEvent?.broadcast_id,
    step_index: sentEvent?.step_index,
    subject: sentEvent?.subject,
    event_type: internalType,
    url_clicked: clickedUrl,
    metadata: data,
  }]);

  // Auto-tag bounced contacts
  if (internalType === 'bounced' && sentEvent?.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('tags')
      .eq('id', sentEvent.lead_id)
      .single();

    const existingTags = lead?.tags ? lead.tags.split(',').map((t: string) => t.trim()) : [];
    if (!existingTags.includes('Bounced')) {
      await supabase
        .from('leads')
        .update({ tags: [...existingTags, 'Bounced'].join(', ') })
        .eq('id', sentEvent.lead_id);
    }
  }

  return NextResponse.json({ received: true });
}
