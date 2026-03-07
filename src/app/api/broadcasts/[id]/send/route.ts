import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import {
  replaceTokens,
  injectLinkTracking,
  injectProspectLinkTracking,
  replaceOptInToken,
  injectOpenPixel,
  htmlToPlainText,
  appendUnsubscribeFooter,
  appendColdOutreachFooter,
  wrapInEmailTemplate,
} from '@/lib/tokens';

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

  const isProspectBroadcast = broadcast.audience_source === 'prospects';

  // Fetch audience
  let audience: Record<string, string>[] = [];
  const segmentTags: string[] = broadcast.segment_tags || [];

  if (isProspectBroadcast) {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .not('status', 'in', '("converted","do_not_contact")');

    if (error || !data?.length) {
      return NextResponse.json({ success: false, error: 'No prospects found' }, { status: 400 });
    }

    audience = segmentTags.length > 0
      ? data.filter(p => segmentTags.every((tag: string) =>
          p.tags?.split(',').map((t: string) => t.trim()).includes(tag)
        ))
      : data;
  } else {
    const { data, error } = await supabase.from('leads').select('*');

    if (error || !data?.length) {
      return NextResponse.json({ success: false, error: 'No contacts found' }, { status: 400 });
    }

    audience = segmentTags.length > 0
      ? data.filter(l => segmentTags.every((tag: string) =>
          l.tags?.split(',').map((t: string) => t.trim()).includes(tag)
        ))
      : data;
  }

  if (!audience.length) {
    return NextResponse.json({ success: false, error: 'No contacts match segment' }, { status: 400 });
  }

  // A/B test: split audience in half if variant B exists
  const hasAB = !!broadcast.ab_subject_b;
  const halfIndex = Math.ceil(audience.length / 2);

  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < audience.length; i++) {
    const contact = audience[i];
    const isVariantB = hasAB && i >= halfIndex;
    const subject = isVariantB ? broadcast.ab_subject_b : broadcast.subject;

    // Create email event record
    const eventInsert = isProspectBroadcast
      ? { prospect_id: contact.id, broadcast_id: broadcastId, subject, event_type: 'sent' }
      : { lead_id: contact.id, broadcast_id: broadcastId, subject, event_type: 'sent' };

    const { data: eventRow } = await supabase
      .from('email_events')
      .insert([eventInsert])
      .select()
      .single();

    const emailEventId = eventRow?.id || 'unknown';

    let bodyHtml = replaceTokens(broadcast.body_html, contact);
    bodyHtml = wrapInEmailTemplate(subject, bodyHtml);

    if (isProspectBroadcast) {
      bodyHtml = replaceOptInToken(bodyHtml, contact.id, BASE_URL);
      bodyHtml = injectProspectLinkTracking(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = appendColdOutreachFooter(bodyHtml, `${BASE_URL}/api/unsubscribe?pid=${contact.id}`);
    } else {
      bodyHtml = injectLinkTracking(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = injectOpenPixel(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = appendUnsubscribeFooter(bodyHtml, `${BASE_URL}/api/unsubscribe?lid=${contact.id}`);
    }

    try {
      const result = await resend.emails.send({
        from: 'Lian <lian@yourhq.co.nz>',
        to: [contact.email],
        subject,
        ...(broadcast.is_plain_text
          ? { text: replaceTokens(broadcast.body_text || htmlToPlainText(broadcast.body_html), contact) }
          : { html: bodyHtml }),
        tags: [{ name: 'broadcast_id', value: broadcastId }],
      });

      if (result.data?.id) {
        await supabase.from('email_events').update({ resend_email_id: result.data.id }).eq('id', emailEventId);
      }

      // Mark prospect as contacted
      if (isProspectBroadcast) {
        await supabase
          .from('prospects')
          .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
          .eq('id', contact.id)
          .eq('status', 'not_contacted');
      }

      sentCount++;
    } catch (err) {
      errors.push(`${contact.email}: ${err}`);
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
