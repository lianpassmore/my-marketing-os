import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: flowId } = await params;

  // Set all active enrollments for this flow to be due now
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('flow_enrollments')
    .update({ next_send_at: now })
    .eq('flow_id', flowId)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger the cron to process them immediately
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CRON_SECRET) headers['Authorization'] = `Bearer ${CRON_SECRET}`;

  try {
    await fetch(`${BASE_URL}/api/cron/execute-flows`, { method: 'GET', headers });
  } catch {
    // Non-fatal — enrollments are already marked due, cron will pick them up on next run
  }

  return NextResponse.json({ ok: true });
}
