import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { replaceTokens, injectLinkTracking, injectProspectLinkTracking, injectOpenPixel, replaceOptInToken, htmlToPlainText, getNextSendAt, parseDaysFromLabel, appendUnsubscribeFooter, appendColdOutreachFooter, wrapInEmailTemplate } from '@/lib/tokens';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

type Contact = {
  id: string;
  name?: string;
  email: string;
  company?: string;
  role?: string;
  tags?: string;
};

type FlowNode = {
  id: string;
  data: { label: string; subjectLine?: string; bodyHtml?: string; subject?: string; body?: string; conditionType?: string };
  style?: Record<string, unknown>;
};

type FlowEnrollment = {
  id: string;
  flow_id: string;
  lead_id: string | null;
  prospect_id: string | null;
  current_step_index: number;
  next_send_at: string;
  status: string;
};

type Flow = {
  id: string;
  name: string;
  nodes: FlowNode[];
  send_days: string[];
  send_time: string;
};

export async function GET(request: NextRequest) {
  // Protect cron endpoint
  if (CRON_SECRET) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date().toISOString();

  // Fetch all due enrollments
  const { data: enrollments, error: enrollErr } = await supabase
    .from('flow_enrollments')
    .select('*')
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(100); // Process up to 100 per run

  if (enrollErr) {
    return NextResponse.json({ success: false, error: enrollErr.message }, { status: 500 });
  }

  if (!enrollments?.length) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  let processed = 0;
  let errors = 0;

  for (const enrollment of enrollments as FlowEnrollment[]) {
    try {
      await processEnrollment(enrollment);
      processed++;
    } catch (err) {
      console.error(`Failed enrollment ${enrollment.id}:`, err);
      errors++;
    }
  }

  // Auto-enroll new leads into welcome flows
  await enrollNewLeads();

  // Re-engagement check: tag leads with no opens in 30 days
  await checkReEngagement();

  return NextResponse.json({ success: true, processed, errors });
}

async function processEnrollment(enrollment: FlowEnrollment) {
  const isProspect = !!enrollment.prospect_id;

  // Fetch the flow
  const { data: flow } = await supabase
    .from('flows')
    .select('*')
    .eq('id', enrollment.flow_id)
    .single() as { data: Flow | null };

  if (!flow) {
    await supabase.from('flow_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
    return;
  }

  // Fetch the contact (lead or prospect)
  let contact: Contact | null = null;

  if (isProspect) {
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', enrollment.prospect_id)
      .single();
    // Skip converted or do_not_contact prospects
    if (!data || data.status === 'do_not_contact' || data.status === 'converted') {
      await supabase.from('flow_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
      return;
    }
    contact = data as Contact;
  } else {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('id', enrollment.lead_id)
      .single();
    contact = data as Contact | null;
  }

  if (!contact) {
    await supabase.from('flow_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
    return;
  }

  const nodes = flow.nodes as FlowNode[];
  const stepIndex = enrollment.current_step_index;

  if (stepIndex >= nodes.length) {
    await supabase.from('flow_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
    return;
  }

  const node = nodes[stepIndex];
  const label = node?.data?.label || '';

  // Handle different node types
  if (label.includes('📧') || label.toLowerCase().includes('send email') || label.toLowerCase().includes('email')) {
    // Email node — send email
    const subject = node.data.subjectLine || node.data.subject || label.replace('📧', '').trim();
    const rawHtml = node.data.bodyHtml || node.data.body || `<p>Hi {{firstName}},</p><p>${label}</p>`;

    const eventInsert = isProspect
      ? { prospect_id: contact.id, flow_id: flow.id, step_index: stepIndex, subject, event_type: 'sent' }
      : { lead_id: contact.id, flow_id: flow.id, step_index: stepIndex, subject, event_type: 'sent' };

    const { data: eventRow } = await supabase
      .from('email_events')
      .insert([eventInsert])
      .select()
      .single();

    const emailEventId = eventRow?.id || 'unknown';
    let bodyHtml = replaceTokens(rawHtml, contact);
    bodyHtml = wrapInEmailTemplate(subject, bodyHtml);

    if (isProspect) {
      bodyHtml = replaceOptInToken(bodyHtml, contact.id, BASE_URL);
      bodyHtml = injectProspectLinkTracking(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = appendColdOutreachFooter(bodyHtml, `${BASE_URL}/api/unsubscribe?pid=${contact.id}`);
    } else {
      bodyHtml = injectLinkTracking(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = injectOpenPixel(bodyHtml, contact.id, emailEventId, BASE_URL);
      bodyHtml = appendUnsubscribeFooter(bodyHtml, `${BASE_URL}/api/unsubscribe?lid=${contact.id}`);
    }

    const result = await resend.emails.send({
      from: 'Lian <lian@yourhq.co.nz>',
      to: [contact.email],
      subject: replaceTokens(subject, contact),
      html: bodyHtml,
      tags: [{ name: 'flow_id', value: flow.id }],
    });

    if (result.data?.id) {
      await supabase.from('email_events').update({ resend_email_id: result.data.id }).eq('id', emailEventId);
    }

    // After first send, mark prospect as contacted
    if (isProspect) {
      await supabase
        .from('prospects')
        .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
        .eq('id', contact.id)
        .eq('status', 'not_contacted');
    }

    await advanceEnrollment(enrollment, nodes, stepIndex, flow);

  } else if (label.includes('🏷️') || label.toLowerCase().includes('tag')) {
    // Tag node — only applies to leads (prospects use status instead)
    if (!isProspect) {
      const tagMatch = label.match(/Add Tag[:\s]+(.+)/i) || label.match(/🏷️\s*(.+)/);
      const tagToAdd = tagMatch ? tagMatch[1].trim() : 'Tagged';
      const existingTags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
      if (!existingTags.includes(tagToAdd)) {
        await supabase.from('leads').update({ tags: [...existingTags, tagToAdd].join(', ') }).eq('id', contact.id);
      }
    }
    await advanceEnrollment(enrollment, nodes, stepIndex, flow);

  } else if (label.toLowerCase().includes('condition') || label.includes('if ')) {
    // Condition node — check if contact opened previous email
    const conditionType = node.data.conditionType || 'opened';
    const contactFilter = isProspect ? { prospect_id: contact.id } : { lead_id: contact.id };
    const { count } = await supabase
      .from('email_events')
      .select('*', { count: 'exact', head: true })
      .match(contactFilter)
      .eq('flow_id', flow.id)
      .eq('event_type', conditionType)
      .lt('step_index', stepIndex);

    const conditionMet = (count ?? 0) > 0;
    const nextStep = conditionMet ? stepIndex + 1 : stepIndex + 2;
    const nextSendAt = getNextSendAt(0, flow.send_days, flow.send_time);
    await supabase.from('flow_enrollments').update({
      current_step_index: nextStep,
      next_send_at: nextSendAt.toISOString(),
    }).eq('id', enrollment.id);

  } else if (label.includes('⏳') || label.toLowerCase().includes('wait')) {
    // Delay node — calculate next send time
    const days = parseDaysFromLabel(label);
    const nextSendAt = getNextSendAt(days, flow.send_days, flow.send_time);
    await supabase.from('flow_enrollments').update({
      current_step_index: stepIndex + 1,
      next_send_at: nextSendAt.toISOString(),
    }).eq('id', enrollment.id);

  } else {
    // Unknown node type — skip
    await advanceEnrollment(enrollment, nodes, stepIndex, flow);
  }
}

async function advanceEnrollment(enrollment: FlowEnrollment, nodes: FlowNode[], currentIndex: number, flow: Flow) {
  const nextIndex = currentIndex + 1;

  if (nextIndex >= nodes.length) {
    await supabase.from('flow_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
    return;
  }

  // Check if next node is a delay — if so, schedule accordingly
  const nextNode = nodes[nextIndex];
  const nextLabel = nextNode?.data?.label || '';

  if (nextLabel.includes('⏳') || nextLabel.toLowerCase().includes('wait')) {
    const days = parseDaysFromLabel(nextLabel);
    const nextSendAt = getNextSendAt(days, flow.send_days, flow.send_time);
    await supabase.from('flow_enrollments').update({
      current_step_index: nextIndex + 1, // skip past the delay node
      next_send_at: nextSendAt.toISOString(),
    }).eq('id', enrollment.id);
  } else {
    // Execute immediately
    const nextSendAt = getNextSendAt(0, flow.send_days, flow.send_time);
    await supabase.from('flow_enrollments').update({
      current_step_index: nextIndex,
      next_send_at: nextSendAt.toISOString(),
    }).eq('id', enrollment.id);
  }
}

async function enrollNewLeads() {
  // Fetch all active flows with tag or new_contact triggers
  const { data: triggerFlows } = await supabase
    .from('flows')
    .select('id, trigger_type, trigger_tag, send_days, send_time')
    .in('trigger_type', ['tag', 'new_contact'])
    .eq('status', 'active');

  if (!triggerFlows?.length) return;

  for (const flow of triggerFlows) {
    let candidates: { id: string; tags?: string }[] = [];

    if (flow.trigger_type === 'new_contact') {
      // All subscribed, non-unsubscribed leads are candidates
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('consent_status', 'subscribed')
        .eq('unsubscribed', false);
      candidates = data || [];

    } else if (flow.trigger_type === 'tag' && flow.trigger_tag) {
      // Leads whose tags contain the trigger tag
      const { data } = await supabase
        .from('leads')
        .select('id, tags')
        .ilike('tags', `%${flow.trigger_tag}%`);

      // Exact match to avoid partial tag collisions
      candidates = (data || []).filter(l =>
        l.tags?.split(',').map((t: string) => t.trim()).includes(flow.trigger_tag)
      );
    }

    for (const lead of candidates) {
      // Only enroll if not already enrolled in this flow (any status)
      const { count } = await supabase
        .from('flow_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('flow_id', flow.id)
        .eq('lead_id', lead.id);

      if ((count ?? 0) > 0) continue;

      const nextSendAt = getNextSendAt(0, flow.send_days || ['tuesday', 'thursday'], flow.send_time || '10:00');
      await supabase.from('flow_enrollments').insert([{
        flow_id: flow.id,
        lead_id: lead.id,
        current_step_index: 0,
        next_send_at: nextSendAt.toISOString(),
        status: 'active',
      }]);
    }
  }
}

async function checkReEngagement() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find all leads created more than 30 days ago
  const { data: oldLeads } = await supabase
    .from('leads')
    .select('id, tags')
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (!oldLeads?.length) return;

  for (const lead of oldLeads) {
    const existingTags = lead.tags ? lead.tags.split(',').map((t: string) => t.trim()) : [];
    if (existingTags.includes('Re-engage') || existingTags.includes('Inactive')) continue;

    // Check if they've opened anything in 30 days
    const { count } = await supabase
      .from('email_events')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', lead.id)
      .eq('event_type', 'opened')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if ((count ?? 0) === 0) {
      const newTags = [...existingTags, 'Re-engage'].join(', ');
      await supabase.from('leads').update({ tags: newTags }).eq('id', lead.id);

      // Find and enroll in re-engagement flow if one exists
      const { data: reEngageFlow } = await supabase
        .from('flows')
        .select('id')
        .eq('trigger_type', 'tag')
        .eq('trigger_tag', 'Re-engage')
        .eq('status', 'active')
        .maybeSingle();

      if (reEngageFlow) {
        const { count: alreadyEnrolled } = await supabase
          .from('flow_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('flow_id', reEngageFlow.id)
          .eq('lead_id', lead.id);

        if ((alreadyEnrolled ?? 0) === 0) {
          const nextSendAt = getNextSendAt(0, ['tuesday', 'thursday'], '10:00');
          await supabase.from('flow_enrollments').insert([{
            flow_id: reEngageFlow.id,
            lead_id: lead.id,
            current_step_index: 0,
            next_send_at: nextSendAt.toISOString(),
            status: 'active',
          }]);
        }
      }
    }
  }
}
