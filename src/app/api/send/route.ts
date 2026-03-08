import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { htmlToPlainText, appendUnsubscribeFooter, replaceTokens } from '@/lib/tokens';

const resend = new Resend(process.env.RESEND_API_KEY);

// Default test contact — used so tokens render correctly in test sends
const TEST_CONTACT = {
  name: 'Lian DreamStorm',
  email: 'lian@yourhq.co.nz',
  company: 'YourHQ',
  role: 'Founder',
  city: 'Whangārei',
  reviews: '4.9 ★ (48)',
  type: 'Marketing Agency',
  phone: '022 172 5793',
};

export async function POST(request: Request) {
  try {
    const { to, subject, html, isPlainText } = await request.json();
    const resolvedSubject = replaceTokens(subject, TEST_CONTACT);
    const resolvedHtml = replaceTokens(html, TEST_CONTACT);
    const htmlWithFooter = appendUnsubscribeFooter(resolvedHtml, '#');

    const data = await resend.emails.send(
      isPlainText
        ? { from: 'Lian <lian@yourhq.co.nz>', to: [to], subject: resolvedSubject, text: htmlToPlainText(htmlWithFooter) }
        : { from: 'Lian <lian@yourhq.co.nz>', to: [to], subject: resolvedSubject, html: htmlWithFooter }
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
