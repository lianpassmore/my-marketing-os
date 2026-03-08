"use client";

import { useState, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Sparkles, Save, Upload, Calendar, FileText, Eye, X, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// ── Newsletter HTML template ────────────────────────────────────────────────
function buildNewsletterHtml({
  newsletterName,
  issueLabel,
  subject,
  intro,
  mainHeadline,
  mainBody,
  updates,
  ctaText,
  ctaUrl,
}: {
  newsletterName: string;
  issueLabel: string;
  subject: string;
  intro: string;
  mainHeadline: string;
  mainBody: string;
  updates: string;
  ctaText: string;
  ctaUrl: string;
}) {
  const updatesHtml = updates
    ? updates
        .split('\n')
        .filter(Boolean)
        .map(line => `<li style="margin-bottom:8px;color:#475569;">${line.replace(/^[-•*]\s*/, '')}</li>`)
        .join('')
    : '';

  const ctaBlock =
    ctaText && ctaUrl
      ? `<div style="text-align:center;margin:32px 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:#5046E5;color:#fff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">${ctaText}</a>
         </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
    <!-- Header -->
    <div style="background:#1E1B4B;padding:28px 40px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">${newsletterName || 'The Newsletter'}</div>
      ${issueLabel ? `<div style="font-size:12px;color:#A5B4FC;margin-top:6px;letter-spacing:0.5px;">${issueLabel}</div>` : ''}
    </div>
    <!-- Subject -->
    <div style="padding:28px 40px 0;">
      <h1 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 16px;line-height:1.3;">${subject}</h1>
      ${intro ? `<p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">${intro.replace(/\n/g, '<br>')}</p>` : ''}
    </div>
    <!-- Main story -->
    ${mainHeadline || mainBody ? `
    <div style="padding:0 40px 24px;">
      <div style="border-top:2px solid #5046E5;padding-top:20px;">
        ${mainHeadline ? `<h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 12px;">${mainHeadline}</h2>` : ''}
        ${mainBody ? `<div style="font-size:15px;color:#475569;line-height:1.7;">${mainBody.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </div>` : ''}
    <!-- Quick Updates -->
    ${updatesHtml ? `
    <div style="padding:0 40px 24px;">
      <div style="background:#F8FAFC;border-radius:8px;padding:20px 24px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#5046E5;margin-bottom:12px;">Quick Updates</div>
        <ul style="margin:0;padding-left:16px;">${updatesHtml}</ul>
      </div>
    </div>` : ''}
    <!-- CTA -->
    ${ctaBlock}
    <!-- Footer -->
    <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">You're receiving this because you subscribed. <a href="{{unsubscribeUrl}}" style="color:#5046E5;text-decoration:underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── CSV parsing ──────────────────────────────────────────────────────────────
type CsvIssue = {
  subject: string;
  body: string;
  scheduled_for: string;
  error?: string;
};

function parseCsv(text: string): CsvIssue[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const subjectIdx = headers.findIndex(h => h.includes('subject') || h.includes('title'));
  const bodyIdx = headers.findIndex(h => h.includes('body') || h.includes('content') || h.includes('text'));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('scheduled') || h.includes('send'));

  return lines.slice(1).map(line => {
    // Handle quoted CSV fields
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur);

    const subject = subjectIdx >= 0 ? cols[subjectIdx]?.trim() : '';
    const body = bodyIdx >= 0 ? cols[bodyIdx]?.trim() : '';
    const scheduled_for = dateIdx >= 0 ? cols[dateIdx]?.trim() : '';

    const issue: CsvIssue = { subject, body, scheduled_for };
    if (!subject) issue.error = 'Missing subject';
    else if (scheduled_for && isNaN(new Date(scheduled_for).getTime())) issue.error = 'Invalid date';
    return issue;
  }).filter(r => r.subject || r.body);
}

// ── Component ────────────────────────────────────────────────────────────────
type Tab = 'compose' | 'import';

export default function NewsletterComposer() {
  const [tab, setTab] = useState<Tab>('compose');

  // Compose fields
  const [newsletterName, setNewsletterName] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [intro, setIntro] = useState('');
  const [mainHeadline, setMainHeadline] = useState('');
  const [mainBody, setMainBody] = useState('');
  const [updates, setUpdates] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [testEmail, setTestEmail] = useState('lian@yourhq.co.nz');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // CSV import fields
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvIssues, setCsvIssues] = useState<CsvIssue[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const preview = buildNewsletterHtml({ newsletterName, issueLabel, subject, intro, mainHeadline, mainBody, updates, ctaText, ctaUrl });
  const hasContent = subject.trim().length > 0;

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, framework: 'newsletter' }),
      });
      const { success, data } = await res.json();
      if (success) {
        if (data.subject) setSubject(data.subject);
        if (data.body) {
          // Try to split AI output into sections
          const body: string = data.body;
          const lines = body.split('\n').filter(Boolean);
          setIntro(lines[0] || '');
          setMainBody(lines.slice(1).join('\n'));
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTest = async () => {
    if (!subject) { alert('Add a subject first.'); return; }
    setIsSendingTest(true);
    setTestSent(false);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, subject, html: preview }),
      });
      if (res.ok) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSave = async () => {
    if (!hasContent) { alert('Add a subject first.'); return; }
    setIsSaving(true);
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body_html: preview,
          framework: 'newsletter',
          scheduled_for: scheduledFor || null,
          segment_tags: [],
        }),
      });
      const { success, data } = await res.json();
      if (success) { setSavedId(data.id); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAll = async () => {
    if (!savedId) { alert('Save the issue first.'); return; }
    if (!confirm('Send this newsletter issue to your full audience now?')) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch(`/api/broadcasts/${savedId}/send`, { method: 'POST' });
      const { success, sent } = await res.json();
      if (success) {
        setBroadcastSuccess(true);
        alert(`Sent to ${sent} contacts.`);
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvIssues(parseCsv(text));
      setImportDone(false);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const valid = csvIssues.filter(i => !i.error);
    if (!valid.length) return;
    setIsImporting(true);
    let count = 0;
    for (const issue of valid) {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: issue.subject,
          body_html: issue.body,
          framework: 'newsletter',
          scheduled_for: issue.scheduled_for || null,
          segment_tags: [],
        }),
      });
      if (res.ok) count++;
    }
    setImportCount(count);
    setImportDone(true);
    setIsImporting(false);
  };

  return (
    <div className="flex flex-col h-screen bg-surface-cloud overflow-hidden w-full">
      {/* Header */}
      <header className="h-16 bg-surface-paper border-b border-surface-mist flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/newsletter" className="text-content-slate hover:text-brand-storm transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex bg-surface-cloud rounded-lg p-1 border border-surface-mist">
            <button
              onClick={() => setTab('compose')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'compose' ? 'bg-white text-content-ink shadow-sm' : 'text-content-slate hover:text-content-ink'}`}
            >
              <span className="flex items-center gap-1.5"><FileText size={14} /> Compose</span>
            </button>
            <button
              onClick={() => setTab('import')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'import' ? 'bg-white text-content-ink shadow-sm' : 'text-content-slate hover:text-content-ink'}`}
            >
              <span className="flex items-center gap-1.5"><Upload size={14} /> Import CSV</span>
            </button>
          </div>
        </div>

        {tab === 'compose' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-slate">Test:</span>
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
              className="text-sm border border-surface-mist rounded-md px-3 py-1.5 w-44 focus:border-brand-storm outline-none" />
            <button onClick={handleSendTest} disabled={isSendingTest}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${testSent ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'}`}>
              {isSendingTest ? <Loader2 size={14} className="animate-spin" /> : testSent ? <Check size={14} /> : <Send size={14} />}
              {testSent ? 'Sent' : 'Test'}
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'}`}>
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <Check size={14} /> : <Save size={14} />}
              {saveSuccess ? 'Saved' : 'Save Draft'}
            </button>
            <button onClick={handleSendAll} disabled={isBroadcasting || !savedId}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${broadcastSuccess ? 'bg-green-500 text-white' : 'bg-brand-storm hover:bg-brand-indigo text-white shadow-sm'}`}>
              {isBroadcasting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {broadcastSuccess ? 'Sent!' : 'Send Now'}
            </button>
          </div>
        )}
      </header>

      {/* ── Compose Tab ────────────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel */}
          <aside className="w-80 bg-surface-paper border-r border-surface-mist flex flex-col overflow-y-auto shrink-0">
            {/* AI assist */}
            <div className="p-5 border-b border-surface-mist bg-brand-glow/30">
              <div className="flex items-center text-brand-storm font-semibold mb-4">
                <Sparkles size={16} className="mr-2" /> AI Assist
              </div>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Describe this week's topic or theme…"
                className="w-full h-20 p-3 text-sm border border-surface-mist rounded-lg focus:border-brand-storm outline-none resize-none bg-white mb-3"
              />
              <button onClick={handleGenerate} disabled={isGenerating || !topic}
                className="w-full bg-content-ink hover:bg-black text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {isGenerating ? 'Generating…' : 'Generate Draft'}
              </button>
            </div>

            {/* Newsletter identity */}
            <div className="p-5 border-b border-surface-mist space-y-3">
              <p className="text-xs font-semibold text-content-slate uppercase tracking-wider">Newsletter Identity</p>
              <div>
                <label className="text-xs text-content-slate mb-1 block">Newsletter Name</label>
                <input value={newsletterName} onChange={e => setNewsletterName(e.target.value)}
                  placeholder="e.g. The Weekly Signal"
                  className="w-full text-sm border border-surface-mist rounded-md px-3 py-2 outline-none focus:border-brand-storm" />
              </div>
              <div>
                <label className="text-xs text-content-slate mb-1 block">Issue Label</label>
                <input value={issueLabel} onChange={e => setIssueLabel(e.target.value)}
                  placeholder="e.g. Issue #12 · March 2026"
                  className="w-full text-sm border border-surface-mist rounded-md px-3 py-2 outline-none focus:border-brand-storm" />
              </div>
            </div>

            {/* Schedule */}
            <div className="p-5">
              <p className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-3">Schedule</p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-content-slate shrink-0" />
                <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
                  className="flex-1 text-sm border border-surface-mist rounded-md px-2.5 py-1.5 outline-none focus:border-brand-storm bg-white" />
              </div>
              <p className="text-xs text-content-slate mt-2">Leave empty to save as a draft you send manually.</p>
            </div>
          </aside>

          {/* Center: form */}
          <div className="w-96 bg-surface-paper border-r border-surface-mist flex flex-col overflow-y-auto shrink-0">
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">Subject Line</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Your subject line…"
                  className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">Opening / Intro</label>
                <textarea value={intro} onChange={e => setIntro(e.target.value)}
                  placeholder="Hey {{firstName}}, here's what's new this week…"
                  rows={3}
                  className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">Main Story Headline</label>
                <input value={mainHeadline} onChange={e => setMainHeadline(e.target.value)}
                  placeholder="The headline for your main piece…"
                  className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">Main Story Body</label>
                <textarea value={mainBody} onChange={e => setMainBody(e.target.value)}
                  placeholder="Write the body of your main story…"
                  rows={6}
                  className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">Quick Updates</label>
                <p className="text-xs text-content-slate mb-2">One bullet per line. Start with - or just type.</p>
                <textarea value={updates} onChange={e => setUpdates(e.target.value)}
                  placeholder="- New blog post: How to 10x your close rate&#10;- We're hiring a sales rep&#10;- Free webinar this Thursday"
                  rows={4}
                  className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">CTA Button Text</label>
                  <input value={ctaText} onChange={e => setCtaText(e.target.value)}
                    placeholder="Read the full story"
                    className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-1.5 block">CTA URL</label>
                  <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: preview */}
          <div className="flex-1 bg-surface-cloud flex flex-col overflow-hidden">
            <div className="shrink-0 px-6 py-3 border-b border-surface-mist bg-surface-paper flex items-center gap-2">
              <Eye size={14} className="text-content-slate" />
              <span className="text-xs font-semibold text-content-slate uppercase tracking-wider">Live Preview</span>
            </div>
            {hasContent ? (
              <iframe srcDoc={preview} className="flex-1 w-full border-0" title="Newsletter Preview" sandbox="allow-same-origin" />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-12">
                <div>
                  <div className="w-14 h-14 bg-surface-paper rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-mist">
                    <Eye size={24} className="text-content-slate opacity-30" />
                  </div>
                  <p className="text-sm text-content-slate">Fill in your subject line to see a preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Import Tab ──────────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="bg-surface-paper rounded-xl border border-surface-mist p-6 mb-6">
            <h2 className="text-base font-semibold text-content-ink mb-1">Bulk Import Newsletter Issues</h2>
            <p className="text-sm text-content-slate mb-4">
              Upload a CSV with your planned newsletter issues. Each row becomes a saved draft.
              Schedule them out weekly or monthly and they'll appear in your newsletter planner.
            </p>

            {/* CSV format guide */}
            <div className="bg-surface-cloud border border-surface-mist rounded-lg p-4 mb-5 font-mono text-xs text-content-slate">
              <div className="font-semibold text-content-ink mb-1">Expected CSV columns:</div>
              <div>subject, body, scheduled_date</div>
              <div className="mt-2 text-content-slate/70">Example row:</div>
              <div>&quot;March Issue: Spring Strategies&quot;, &quot;&lt;p&gt;Hello…&lt;/p&gt;&quot;, &quot;2026-03-15&quot;</div>
            </div>

            {/* Download template */}
            <a
              href="data:text/csv;charset=utf-8,subject%2Cbody%2Cscheduled_date%0A%22Issue%20%231%3A%20Your%20Title%22%2C%22%3Cp%3EYour%20newsletter%20body%20here.%3C%2Fp%3E%22%2C%222026-03-15%22%0A%22Issue%20%232%3A%20Another%20Title%22%2C%22%3Cp%3EMore%20content%20here.%3C%2Fp%3E%22%2C%222026-04-15%22"
              download="newsletter-template.csv"
              className="inline-flex items-center gap-2 text-sm text-brand-storm font-medium hover:underline mb-5"
            >
              <Upload size={14} /> Download CSV template
            </a>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-surface-mist rounded-xl p-10 text-center cursor-pointer hover:border-brand-storm hover:bg-brand-glow/20 transition-colors"
            >
              <Upload size={28} className="text-content-slate opacity-40 mx-auto mb-3" />
              <p className="text-sm font-medium text-content-ink mb-1">Click to upload your CSV</p>
              <p className="text-xs text-content-slate">or drag and drop</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* Parsed preview */}
          {csvIssues.length > 0 && (
            <div className="bg-surface-paper rounded-xl border border-surface-mist overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-mist flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-content-ink">{csvIssues.length} issues found</span>
                  <span className="text-xs text-content-slate ml-2">
                    ({csvIssues.filter(i => !i.error).length} valid · {csvIssues.filter(i => i.error).length} with errors)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setCsvIssues([]); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-xs text-content-slate hover:text-content-ink flex items-center gap-1">
                    <X size={13} /> Clear
                  </button>
                  {!importDone && (
                    <button onClick={handleImport} disabled={isImporting || csvIssues.every(i => !!i.error)}
                      className="px-4 py-2 bg-brand-storm text-white rounded-lg text-sm font-medium hover:bg-brand-indigo disabled:opacity-50 flex items-center gap-2">
                      {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {isImporting ? 'Importing…' : `Import ${csvIssues.filter(i => !i.error).length} Issues`}
                    </button>
                  )}
                  {importDone && (
                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                      <Check size={16} /> {importCount} issues saved as drafts
                    </div>
                  )}
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-mist text-xs font-semibold text-content-slate uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Subject</th>
                    <th className="text-left px-6 py-3">Scheduled</th>
                    <th className="text-left px-6 py-3">Body preview</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-mist">
                  {csvIssues.map((issue, i) => (
                    <tr key={i} className={issue.error ? 'bg-red-50' : ''}>
                      <td className="px-6 py-3 text-sm font-medium text-content-ink max-w-xs">
                        <span className="line-clamp-1">{issue.subject || '(empty)'}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-content-slate whitespace-nowrap">
                        {issue.scheduled_for ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(issue.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-content-slate max-w-xs">
                        <span className="line-clamp-1">{issue.body.replace(/<[^>]+>/g, '').slice(0, 80) || '—'}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {issue.error && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle size={12} /> {issue.error}
                          </span>
                        )}
                        {!issue.error && <Check size={14} className="text-green-500 ml-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
