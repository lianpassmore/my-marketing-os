type Lead = {
  id?: string;
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  tags?: string;
  [key: string]: string | undefined;
};

/** Replace {{tokens}} in email HTML/text with lead data */
export function replaceTokens(content: string, lead: Lead): string {
  const firstName = lead.name ? lead.name.split(' ')[0] : 'Friend';
  const lastName = lead.name ? lead.name.split(' ').slice(1).join(' ') : '';

  return content
    .replace(/\{\{firstName\}\}/gi, firstName)
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{\{lastName\}\}/gi, lastName)
    .replace(/\{last_name\}/gi, lastName)
    .replace(/\{\{fullName\}\}/gi, lead.name || 'Friend')
    .replace(/\{full_name\}/gi, lead.name || 'Friend')
    .replace(/\{\{company\}\}/gi, lead.company || 'your business')
    .replace(/\{company\}/gi, lead.company || 'your business')
    .replace(/\{\{role\}\}/gi, lead.role || 'your role')
    .replace(/\{role\}/gi, lead.role || 'your role')
    .replace(/\{\{email\}\}/gi, lead.email || '')
    .replace(/\{email\}/gi, lead.email || '');
}

/** Wrap all href links in email HTML with a tracking redirect URL */
export function injectLinkTracking(
  html: string,
  leadId: string,
  emailEventId: string,
  baseUrl: string
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url) => {
      const tracked = `${baseUrl}/api/track?eid=${emailEventId}&lid=${leadId}&url=${encodeURIComponent(url)}`;
      return `href="${tracked}"`;
    }
  );
}

/** Same as injectLinkTracking but uses pid= for prospect emails */
export function injectProspectLinkTracking(
  html: string,
  prospectId: string,
  emailEventId: string,
  baseUrl: string
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url) => {
      const tracked = `${baseUrl}/api/track?eid=${emailEventId}&pid=${prospectId}&url=${encodeURIComponent(url)}`;
      return `href="${tracked}"`;
    }
  );
}

/** Replace {{optInUrl}} token with the prospect opt-in link */
export function replaceOptInToken(content: string, prospectId: string, baseUrl: string): string {
  const optInUrl = `${baseUrl}/api/opt-in?pid=${prospectId}`;
  return content.replace(/\{\{optInUrl\}\}/gi, optInUrl);
}

/** Inject a 1x1 open tracking pixel before the closing body/div tag */
export function injectOpenPixel(html: string, leadId: string, emailEventId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track?eid=${emailEventId}&lid=${leadId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return html + pixel;
}

/** Same as injectOpenPixel but uses pid= for prospect emails */
export function injectProspectOpenPixel(html: string, prospectId: string, emailEventId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track?eid=${emailEventId}&pid=${prospectId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return html + pixel;
}

/** Append a CAN-SPAM/GDPR compliant unsubscribe footer to email HTML */
export function appendUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
<div style="margin-top:40px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center;font-family:sans-serif;">
  <p style="font-size:12px;color:#94A3B8;line-height:1.6;margin:0 0 8px;">
    You're receiving this because you opted in to updates from Signal by DreamStorm.
  </p>
  <p style="font-size:12px;color:#94A3B8;margin:0;">
    <a href="${unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
  </p>
</div>`;
  // Insert before closing body tag if present, otherwise append
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return html + footer;
}

/** Convert plain text body to HTML paragraphs if no HTML tags are present */
export function normalizeBodyToHtml(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return '<p>' + body.split(/\n\n+/).map(p => p.replace(/\n/g, '<br>')).join('</p><p>') + '</p>';
}

/** Wrap raw email body HTML in a styled email template */
export function wrapInEmailTemplate(subject: string, bodyHtml: string): string {
  const normalized = normalizeBodyToHtml(bodyHtml);
  const styledBody = normalized.replace(/<p>/gi, '<p style="margin:0 0 16px 0;">');
  return `<div style="font-family:sans-serif;padding:40px;background:#F6F7FB;"><div style="background:white;padding:30px;border-radius:8px;max-width:600px;margin:0 auto;border:1px solid #E6EAF2;"><h2 style="color:#0F172A;margin-top:0;">${subject}</h2><div style="color:#334155;font-size:15px;line-height:1.7;">${styledBody}</div></div></div>`;
}

/** Cold outreach footer — no "opted in" language, includes opt-out link */
export function appendColdOutreachFooter(html: string, optOutUrl: string): string {
  const footer = `
<div style="margin-top:40px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center;font-family:sans-serif;">
  <p style="font-size:12px;color:#94A3B8;line-height:1.6;margin:0 0 8px;">
    You're receiving this as part of a business outreach. This is not a marketing list.
  </p>
  <p style="font-size:12px;color:#94A3B8;margin:0;">
    <a href="${optOutUrl}" style="color:#94A3B8;text-decoration:underline;">Don't want to hear from us? Click here.</a>
  </p>
</div>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return html + footer;
}

/** Strip HTML tags and convert to plain text */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Calculate days from delay label like "Wait 3 Days" */
export function parseDaysFromLabel(label: string): number {
  const match = label.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1], 10) : 1;
}

const SEND_TIMEZONE = 'Pacific/Auckland';

/** Get next send timestamp respecting preferred send days/time (interpreted in NZT) */
export function getNextSendAt(
  daysFromNow: number,
  sendDays: string[],
  sendTime: string
): Date {
  const [hours, minutes] = sendTime.split(':').map(Number);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Get today's date components in NZ timezone
  const now = new Date();
  const nzParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEND_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const nzYear = parseInt(nzParts.find(p => p.type === 'year')!.value);
  const nzMonth = parseInt(nzParts.find(p => p.type === 'month')!.value) - 1;
  const nzDay = parseInt(nzParts.find(p => p.type === 'day')!.value);

  // Build a fake "local" Date representing the target NZ date+time,
  // then find the UTC offset at that moment to get the real UTC time.
  const localBase = new Date(nzYear, nzMonth, nzDay + daysFromNow, hours, minutes || 0, 0, 0);

  // Advance to next allowed send day if needed (day-of-week in NZ)
  if (sendDays.length > 0) {
    let attempts = 0;
    while (!sendDays.includes(dayNames[localBase.getDay()]) && attempts < 7) {
      localBase.setDate(localBase.getDate() + 1);
      attempts++;
    }
  }

  // Convert NZ local time → UTC using Intl to get the correct offset (handles DST)
  const localStr = `${localBase.getFullYear()}-${String(localBase.getMonth() + 1).padStart(2, '0')}-${String(localBase.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`;
  // Interpret that string as UTC, then measure how far off it is from NZ time
  const asUtc = new Date(localStr + 'Z');
  const nzAtUtc = new Date(asUtc.toLocaleString('en-US', { timeZone: SEND_TIMEZONE }));
  const offsetMs = asUtc.getTime() - nzAtUtc.getTime();
  return new Date(asUtc.getTime() + offsetMs);
}
