import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { subject, body_html, body_text, framework, segment_tags, is_plain_text, ab_subject_b } = body;

  const { data, error } = await supabase
    .from('broadcasts')
    .insert([{ subject, body_html, body_text, framework, segment_tags, is_plain_text, ab_subject_b, status: 'draft' }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
