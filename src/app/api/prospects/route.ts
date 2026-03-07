import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
  }

  // Dedup check: already a lead?
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle();

  if (existingLead) {
    return NextResponse.json(
      { success: false, error: 'This email already exists as an opted-in contact.', existing: 'lead', lead: existingLead },
      { status: 409 }
    );
  }

  // Dedup check: already a prospect?
  const { data: existingProspect } = await supabase
    .from('prospects')
    .select('id, email, status')
    .eq('email', email)
    .maybeSingle();

  if (existingProspect) {
    return NextResponse.json(
      { success: false, error: 'This email is already in your prospects list.', existing: 'prospect', prospect: existingProspect },
      { status: 409 }
    );
  }

  const payload = {
    email,
    name: body.name?.trim() || null,
    company: body.company?.trim() || null,
    role: body.role?.trim() || null,
    website: body.website?.trim() || null,
    source: body.source?.trim() || null,
    notes: body.notes?.trim() || null,
    tags: body.tags?.trim() || null,
    status: 'not_contacted',
  };

  const { data, error } = await supabase
    .from('prospects')
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
