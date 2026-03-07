import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailEventId = searchParams.get('eid');
  const leadId = searchParams.get('lid');
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.redirect('/');
  }

  // Record click event asynchronously (don't block the redirect)
  if (emailEventId && leadId) {
    void supabase
      .from('email_events')
      .insert([{
        lead_id: leadId,
        event_type: 'clicked',
        url_clicked: url,
        metadata: { source_event_id: emailEventId },
      }]);
  }

  try {
    const destination = decodeURIComponent(url);
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect('/');
  }
}
