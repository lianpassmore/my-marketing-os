import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('lid');
  const prospectId = searchParams.get('pid');

  if (!leadId && !prospectId) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 });
  }

  if (prospectId) {
    // Mark prospect as do_not_contact and cancel any active flow enrollments
    const { error } = await supabase
      .from('prospects')
      .update({ status: 'do_not_contact' })
      .eq('id', prospectId);

    if (error) {
      return new NextResponse('Something went wrong. Please try again.', { status: 500 });
    }

    await supabase
      .from('flow_enrollments')
      .update({ status: 'completed' })
      .eq('prospect_id', prospectId)
      .eq('status', 'active');
  } else {
    const { error } = await supabase
      .from('leads')
      .update({ unsubscribed: true })
      .eq('id', leadId);

    if (error) {
      return new NextResponse('Something went wrong. Please try again.', { status: 500 });
    }
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F6F7FB;}
    .card{background:white;border:1px solid #E6EAF2;border-radius:12px;padding:48px;text-align:center;max-width:420px;}
    h1{color:#0F172A;font-size:20px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0;}</style>
    </head><body><div class="card"><h1>You've been removed</h1>
    <p>You won't receive any more emails from us. If this was a mistake, reply to any previous email and we'll sort it out.</p>
    </div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
