import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('flows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, trigger_type, trigger_tag, nodes, edges, status, send_days, send_time } = body;

  const { data, error } = await supabase
    .from('flows')
    .insert([{ name, trigger_type, trigger_tag, nodes, edges, status: status || 'draft', send_days, send_time }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
