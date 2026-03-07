import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { replaceTokens, injectLinkTracking, htmlToPlainText, appendUnsubscribeFooter, wrapInEmailTemplate } from '@/lib/tokens';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: broadcastId } = await params;

  // Fetch broadcast
  const { data: broadcast, error: bErr } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('id', broadcastId)
    .single();

  if (bErr || !broadcast) {
    return NextResponse.json({ success: false, error: 'Broadcast not found' }, { status: 404 });
  }

  // Fetch audience (optionally filtered by segment tags)
  let query = supabase.from('leads').select('*');
  // Note: tag filtering is done client-side since tags are stored as comma-separated string
  const { data: leads, error: lErr } = await query;

  if (lErr || !leads?.length) {
    return NextResponse.json({ success: false, error: 'No contacts found' }, { status: 400 });
  }

  // Filter by segment tags if set
  const segmentTags: string[] = broadcast.segment_tags || [];
  const audience = segmentTags.length > 0
    ? leads.filter(l => segmentTags.every((tag: string) =>
        l.tags?.split(',').map((t: string) => t.trim()).includes(tag)
      ))
    : leads;

  if (!audience.length) {
    return NextResponse.json({ success: false, error: 'No contacts match segment' }, { status: 400 });
  }

  // A/B test: split audience in half if variant B exists
  const hasAB = !!broadcast.ab_subject_b;
  const halfIndex = Math.ceil(audience.length / 2);

  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < audience.length; i++) {
    const lead = audience[i];
    const isVariantB = hasAB && i >= halfIndex;
    const subject = isVariantB ? broadcast.ab_subject_b : broadcast.subject;

    // Create email event record for tracking
    const { data: eventRow } = await supabase
      .from('email_events')
      .insert([{
        lead_id: lead.id,
        broadcast_id: broadcastId,
        subject,
        event_type: 'sent',
      }])
      .select()
      .single();

    const emailEventId = eventRow?.id || 'unknown';

    // Process HTML: replace tokens + wrap in template + inject link tracking + unsubscribe footer
    let bodyHtml = replaceTokens(broadcast.body_html, lead);
    bodyHtml = wrapInEmailTemplate(subject, bodyHtml);
    bodyHtml = injectLinkTracking(bodyHtml, lead.id, emailEventId, BASE_URL);
    bodyHtml = appendUnsubscribeFooter(bodyHtml, `${BASE_URL}/api/unsubscribe?lid=${lead.id}`);

    try {
      const result = await resend.emails.send({
        from: 'Lian <lian@yourhq.co.nz>',
        to: [lead.email],
        subject,
        ...(broadcast.is_plain_text
          ? { text: replaceTokens(broadcast.body_text || htmlToPlainText(broadcast.body_html), lead) }
          : { html: bodyHtml }),
        tags: [{ name: 'broadcast_id', value: broadcastId }],
      });

      // Update event with Resend email ID
      if (result.data?.id) {
        await supabase
          .from('email_events')
          .update({ resend_email_id: result.data.id })
          .eq('id', emailEventId);
      }

      sentCount++;
    } catch (err) {
      errors.push(`${lead.email}: ${err}`);
    }
  }

  // Mark broadcast as sent
  await supabase
    .from('broadcasts')
    .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: sentCount })
    .eq('id', broadcastId);

  return NextResponse.json({
    success: true,
    sent: sentCount,
    errors: errors.length ? errors : undefined,
  });
}
