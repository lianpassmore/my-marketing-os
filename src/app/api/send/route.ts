import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { htmlToPlainText, appendUnsubscribeFooter } from '@/lib/tokens';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html, isPlainText } = await request.json();
    const htmlWithFooter = appendUnsubscribeFooter(html, '#');

    const data = await resend.emails.send(
      isPlainText
        ? { from: 'Lian <lian@yourhq.co.nz>', to: [to], subject, text: htmlToPlainText(htmlWithFooter) }
        : { from: 'Lian <lian@yourhq.co.nz>', to: [to], subject, html: htmlWithFooter }
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
