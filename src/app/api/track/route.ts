import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailEventId = searchParams.get('eid');
  const leadId = searchParams.get('lid');
  const prospectId = searchParams.get('pid');
  const url = searchParams.get('url');

  // Open tracking pixel (no url param)
  if (!url) {
    if (emailEventId && (leadId || prospectId)) {
      void supabase.from('email_events').insert([{
        ...(leadId ? { lead_id: leadId } : { prospect_id: prospectId }),
        event_type: 'opened',
        metadata: { source_event_id: emailEventId },
      }]);
    }
    return new NextResponse(PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Click tracking (has url param)
  if (emailEventId && (leadId || prospectId)) {
    void supabase.from('email_events').insert([{
      ...(leadId ? { lead_id: leadId } : { prospect_id: prospectId }),
      event_type: 'clicked',
      url_clicked: url,
      metadata: { source_event_id: emailEventId },
    }]);
  }

  try {
    return NextResponse.redirect(decodeURIComponent(url));
  } catch {
    return NextResponse.redirect('/');
  }
}
