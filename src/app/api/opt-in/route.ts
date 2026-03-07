import { NextRequest, NextResponse } from 'next/server';
import { convertProspectToLead } from '@/app/api/prospects/[id]/convert/route';

// GET /api/opt-in?pid=<prospect_id>
// Called when a prospect clicks the {{optInUrl}} link in a cold outreach email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prospectId = searchParams.get('pid');

  if (!prospectId) {
    return new NextResponse('Invalid opt-in link.', { status: 400 });
  }

  const result = await convertProspectToLead(prospectId);

  if (!result.success) {
    return new NextResponse('Something went wrong. Please try again.', { status: 500 });
  }

  const message = result.alreadyLead
    ? "You're already on our list — nothing to do!"
    : "You're in! Thanks for subscribing.";

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscribed</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F6F7FB;}
    .card{background:white;border:1px solid #E6EAF2;border-radius:12px;padding:48px;text-align:center;max-width:420px;}
    h1{color:#0F172A;font-size:20px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0;}</style>
    </head><body><div class="card"><h1>${message}</h1>
    <p>We'll be in touch with updates, news, and things we think you'll find valuable.</p>
    </div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
