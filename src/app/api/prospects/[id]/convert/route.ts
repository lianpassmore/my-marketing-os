import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function convertProspectToLead(prospectId: string): Promise<
  { success: true; lead: Record<string, unknown>; alreadyLead: boolean } |
  { success: false; error: string }
> {
  // Fetch prospect
  const { data: prospect, error: pErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single();

  if (pErr || !prospect) return { success: false, error: 'Prospect not found' };
  if (prospect.status === 'converted' && prospect.converted_to_lead_id) {
    // Already converted — return the existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', prospect.converted_to_lead_id)
      .single();
    return { success: true, lead: existingLead, alreadyLead: true };
  }

  // Dedup: check if this email is already a lead
  const { data: existingLead } = await supabase
    .from('leads')
    .select('*')
    .eq('email', prospect.email)
    .maybeSingle();

  let lead = existingLead;

  if (!lead) {
    // Create the lead
    const { data: newLead, error: lErr } = await supabase
      .from('leads')
      .insert([{
        email: prospect.email,
        name: prospect.name || 'Unknown',
        company: prospect.company || null,
        role: prospect.role || null,
        source: 'Cold Outreach',
        tags: prospect.tags || null,
        consent_status: 'subscribed',
        unsubscribed: false,
      }])
      .select()
      .single();

    if (lErr) return { success: false, error: lErr.message };
    lead = newLead;
  }

  // Mark prospect as converted
  await supabase
    .from('prospects')
    .update({
      status: 'converted',
      converted_to_lead_id: lead.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', prospectId);

  // Cancel any active prospect flow enrollments
  await supabase
    .from('flow_enrollments')
    .update({ status: 'completed' })
    .eq('prospect_id', prospectId)
    .eq('status', 'active');

  return { success: true, lead, alreadyLead: !!existingLead };
}

// POST /api/prospects/:id/convert — manual conversion from UI
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await convertProspectToLead(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, lead: result.lead, alreadyLead: result.alreadyLead });
}
