"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Play, Mail, Hourglass, Zap, Tag, Loader2, GitBranch, X, Check, Upload, Download, Link2, Send } from 'lucide-react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const SEND_DAYS =['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SEND_TIMES =[
  { value: '06:00', label: '6:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '20:00', label: '8:00 PM' },
];

const nodeStyles: Record<string, React.CSSProperties> = {
  trigger: {
    background: '#fff', border: '2px solid #E6EAF2', borderRadius: '8px',
    padding: '12px', width: 250, textAlign: 'center',
    fontWeight: '600', color: '#0F172A', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  email: {
    background: '#E8F0FF', color: '#1E3A8A', border: '2px solid #2D6BFF',
    borderRadius: '8px', padding: '12px', width: 250,
    textAlign: 'center', fontWeight: '500', cursor: 'pointer'
  },
  delay: {
    background: '#F6F7FB', border: '2px dashed #64748B', borderRadius: '8px',
    padding: '10px', width: 250, textAlign: 'center',
    color: '#64748B', fontWeight: '500', cursor: 'pointer'
  },
  tag: {
    background: '#FFFBEB', color: '#92400E', border: '2px solid #F59E0B',
    borderRadius: '8px', padding: '12px', width: 250,
    textAlign: 'center', fontWeight: '500', cursor: 'pointer'
  },
  condition: {
    background: '#F5F3FF', color: '#5B21B6', border: '2px solid #7C3AED',
    borderRadius: '8px', padding: '12px', width: 250,
    textAlign: 'center', fontWeight: '500', cursor: 'pointer'
  },
};

const initialNodes: Node[] =[
  { id: 'trigger', position: { x: 250, y: 50 }, data: { label: '⚡ Trigger: New Contact Added' }, style: nodeStyles.trigger },
  { id: 'email-1', position: { x: 250, y: 150 }, data: { label: '📧 Send "Light" Email 1', subject: '', body: '' }, style: nodeStyles.email },
  { id: 'wait-1', position: { x: 250, y: 250 }, data: { label: '⏳ Wait 3 Days' }, style: nodeStyles.delay },
  { id: 'email-2', position: { x: 250, y: 350 }, data: { label: '📧 Send "Shade" Email 1', subject: '', body: '' }, style: nodeStyles.email },
];

const initialEdges: Edge[] =[
  { id: 'e1', source: 'trigger', target: 'email-1', animated: true, style: { stroke: '#2D6BFF', strokeWidth: 2 } },
  { id: 'e2', source: 'email-1', target: 'wait-1', style: { stroke: '#64748B', strokeWidth: 2 } },
  { id: 'e3', source: 'wait-1', target: 'email-2', animated: true, style: { stroke: '#2D6BFF', strokeWidth: 2 } },
];

function buildNurtureNodes(): Node[] {
  const x = 250;
  const step = 130;
  const items =[
    { id: 'trigger',   label: '⚡ Trigger: New Contact Added',             style: nodeStyles.trigger },
    { id: 'email-1',   label: '📧 Email 1: HVCO Delivery + Welcome',        style: nodeStyles.email },
    { id: 'wait-1',    label: '⏳ Wait 1 Day',                               style: nodeStyles.delay },
    { id: 'email-2',   label: '📧 Email 2: Quick Win / Value Bomb',          style: nodeStyles.email },
    { id: 'wait-2',    label: '⏳ Wait 2 Days',                              style: nodeStyles.delay },
    { id: 'email-3',   label: '📧 Email 3: What Not To Do',                  style: nodeStyles.email },
    { id: 'wait-3',    label: '⏳ Wait 1 Day',                               style: nodeStyles.delay },
    { id: 'email-4',   label: '📧 Email 4: Education — Milestone 1',         style: nodeStyles.email },
    { id: 'wait-4',    label: '⏳ Wait 1 Day',                               style: nodeStyles.delay },
    { id: 'email-5',   label: '📧 Email 5: Education — Milestone 2',         style: nodeStyles.email },
    { id: 'wait-5',    label: '⏳ Wait 2 Days',                              style: nodeStyles.delay },
    { id: 'email-6',   label: '📧 Email 6: Education — Milestone 3',         style: nodeStyles.email },
    { id: 'wait-6',    label: '⏳ Wait 2 Days',                              style: nodeStyles.delay },
    { id: 'email-7',   label: '📧 Email 7: Social Proof + Case Study',       style: nodeStyles.email },
    { id: 'wait-7',    label: '⏳ Wait 2 Days',                              style: nodeStyles.delay },
    { id: 'email-8',   label: '📧 Email 8: The Godfather Offer',             style: nodeStyles.email },
    { id: 'wait-8',    label: '⏳ Wait 2 Days',                              style: nodeStyles.delay },
    { id: 'email-9',   label: '📧 Email 9: Objection Handler',               style: nodeStyles.email },
    { id: 'wait-9',    label: '⏳ Wait 1 Day',                               style: nodeStyles.delay },
    { id: 'email-10',  label: '📧 Email 10: Scarcity / Final Push',          style: nodeStyles.email },
  ];
  return items.map((item, i) => ({
    id: item.id,
    position: { x, y: i * step },
    data: { label: item.label, subject: '', body: '' },
    style: item.style,
  }));
}

function buildNurtureEdges(): Edge[] {
  const ids =[
    'trigger', 'email-1', 'wait-1', 'email-2', 'wait-2', 'email-3', 'wait-3',
    'email-4', 'wait-4', 'email-5', 'wait-5', 'email-6', 'wait-6', 'email-7',
    'wait-7', 'email-8', 'wait-8', 'email-9', 'wait-9', 'email-10',
  ];
  return ids.slice(0, -1).map((id, i) => {
    const target = ids[i + 1];
    const isDelay = target.startsWith('wait');
    return {
      id: `e${i + 1}`,
      source: id,
      target,
      animated: !isDelay,
      style: { stroke: isDelay ? '#64748B' : '#2D6BFF', strokeWidth: 2 },
    };
  });
}

const stepTypes =[
  { type: 'email',     icon: <Mail size={16} className="text-brand-storm mr-3" />,      label: 'Send Email',       defaultLabel: '📧 Send Email' },
  { type: 'delay',     icon: <Hourglass size={16} className="text-content-slate mr-3" />, label: 'Time Delay',      defaultLabel: '⏳ Wait 1 Day' },
  { type: 'tag',       icon: <Tag size={16} className="text-amber-600 mr-3" />,          label: 'Add / Remove Tag', defaultLabel: '🏷️ Add Tag' },
  { type: 'condition', icon: <GitBranch size={16} className="text-purple-600 mr-3" />,   label: 'Condition Branch', defaultLabel: '🔀 If opened → Yes / No' },
];

function EmailDetailPanel({ node, onUpdate, onClose }: {
  node: Node;
  onUpdate: (id: string, data: { subject: string; preview: string; body: string }) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState((node.data.subject as string) || '');
  const [preview, setPreview] = useState((node.data.preview as string) || '');
  const [body, setBody] = useState((node.data.body as string) || '');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const emit = (s: string, p: string, b: string) => onUpdate(node.id, { subject: s, preview: p, body: b });

  const sendTest = async () => {
    if (!subject || !body) { alert('Add a subject and body first.'); return; }
    setIsSendingTest(true);
    try {
      const normalized = /<[a-z][\s\S]*>/i.test(body)
        ? body
        : '<p>' + body.split(/\n\n+/).map((p: string) => p.replace(/\n/g, '<br>')).join('</p><p>') + '</p>';
      const styledBody = normalized.replace(/<p>/gi, '<p style="margin:0 0 16px 0;">');
      const html = `<div style="font-family:sans-serif;padding:40px;background:#F6F7FB;"><div style="background:white;padding:30px;border-radius:8px;max-width:600px;margin:0 auto;border:1px solid #E6EAF2;"><h2 style="color:#0F172A;margin-top:0;">${subject}</h2><div style="color:#334155;font-size:15px;line-height:1.7;">${styledBody}</div></div></div>`;
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'lian@yourhq.co.nz', subject, html }),
      });
      if (res.ok) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }
    } finally {
      setIsSendingTest(false);
    }
  };

  const openLinkPopover = () => {
    const ta = bodyRef.current;
    if (ta) {
      const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
      setLinkText(selected || '');
    }
    setLinkUrl('');
    setShowLinkPopover(true);
  };

  const insertLink = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const text = linkText || url;
    const tag = `<a href="${url}">${text}</a>`;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = body.slice(0, start) + tag + body.slice(end);
    setBody(newBody);
    emit(subject, preview, newBody);
    setShowLinkPopover(false);
    setLinkText('');
    setLinkUrl('');
    // Restore focus after state update
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + tag.length; }, 0);
  };

  return (
    <aside className="w-96 bg-surface-paper border-l border-surface-mist flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-mist shrink-0 bg-brand-glow/30">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-content-ink">Email Editor</h3>
          <p className="text-xs text-brand-indigo mt-0.5 truncate font-medium">{node.data.label as string}</p>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 text-content-slate hover:text-content-ink transition-colors p-1 rounded hover:bg-surface-mist">
          <X size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-content-slate uppercase tracking-wider block mb-1.5">Subject Line</label>
          <input
            type="text"
            value={subject}
            onChange={e => { setSubject(e.target.value); emit(e.target.value, preview, body); }}
            placeholder="e.g. Here's your free guide..."
            className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2 outline-none focus:border-brand-storm bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-content-slate uppercase tracking-wider block mb-1.5">
            Preview Text
            <span className="ml-1.5 font-normal normal-case text-content-slate">(inbox snippet)</span>
          </label>
          <input
            type="text"
            value={preview}
            onChange={e => { setPreview(e.target.value); emit(subject, e.target.value, body); }}
            placeholder="e.g. Open this before anyone else sees it..."
            className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2 outline-none focus:border-brand-storm bg-white"
          />
          <p className="text-xs text-content-slate mt-1">The line shown after the subject in most inboxes.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-content-slate uppercase tracking-wider">Email Body</label>
            <button
              type="button"
              onClick={openLinkPopover}
              className="flex items-center gap-1 text-xs font-medium text-brand-storm hover:text-brand-indigo bg-brand-glow hover:bg-brand-glow/70 px-2 py-1 rounded-md transition-colors"
            >
              <Link2 size={12} />
              Insert Link
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { label: 'yourhq.co.nz', url: 'https://yourhq.co.nz' },
              { label: 'yourhq.co.nz/pricing', url: 'https://yourhq.co.nz/pricing' },
              { label: 'yourhq.co.nz/demo', url: 'https://yourhq.co.nz/demo' },
            ].map(({ label, url }) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  const ta = bodyRef.current;
                  if (!ta) return;
                  const tag = `<a href="${url}">${label}</a>`;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const newBody = body.slice(0, start) + tag + body.slice(end);
                  setBody(newBody);
                  emit(subject, preview, newBody);
                  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + tag.length; }, 0);
                }}
                className="text-xs px-2 py-0.5 rounded border border-surface-mist bg-surface-cloud text-content-slate hover:border-brand-storm hover:text-brand-storm transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {showLinkPopover && (
            <div className="mb-2 bg-white border border-surface-mist rounded-lg p-3 shadow-md space-y-2">
              <p className="text-xs font-semibold text-content-ink">Insert Link</p>
              <input
                type="text"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
                className="w-full text-xs border border-surface-mist rounded px-2.5 py-1.5 outline-none focus:border-brand-storm bg-white"
              />
              <input
                type="text"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://yoursite.com/page"
                className="w-full text-xs border border-surface-mist rounded px-2.5 py-1.5 outline-none focus:border-brand-storm bg-white"
                onKeyDown={e => { if (e.key === 'Enter') insertLink(); }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="flex-1 text-xs font-medium bg-brand-storm text-white rounded px-3 py-1.5 hover:bg-brand-indigo transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkPopover(false)}
                  className="text-xs font-medium text-content-slate hover:text-content-ink px-3 py-1.5 rounded border border-surface-mist transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => { setBody(e.target.value); emit(subject, preview, e.target.value); }}
            placeholder={`Hey {{name}},\n\n`}
            rows={16}
            className="w-full text-sm border border-surface-mist rounded-lg px-3 py-2.5 outline-none focus:border-brand-storm bg-white resize-none leading-relaxed"
          />
          <p className="text-xs text-content-slate mt-1">
            Use <code className="bg-surface-cloud border border-surface-mist px-1 rounded">{'{{name}}'}</code> to personalise.
          </p>
        </div>

        <div className="bg-surface-cloud border border-surface-mist p-4 rounded-lg">
          <p className="text-xs font-semibold text-content-ink mb-1 flex items-center"><Zap size={13} className="mr-1 text-brand-storm" /> Need help writing?</p>
          <p className="text-xs text-content-slate mb-2">Draft copy in the AI Copilot, then paste it here.</p>
          <Link href="/blueprints/new" target="_blank" className="text-xs font-medium text-brand-storm hover:text-brand-indigo">
            Open AI Copilot →
          </Link>
        </div>

        <button
          onClick={sendTest}
          disabled={isSendingTest}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 ${testSent ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'}`}
        >
          {isSendingTest ? <Loader2 size={15} className="mr-2 animate-spin" /> : testSent ? <Check size={15} className="mr-2" /> : <Send size={15} className="mr-2" />}
          {testSent ? 'Sent to lian@yourhq.co.nz' : 'Send Test to Me'}
        </button>
      </div>
    </aside>
  );
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else { field += ch; }
    }
  }
  if (field || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function generateCSVTemplate(nodes: Node[]): string {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ['email_id', 'email_name', 'subject', 'preview_text', 'body'].join(',');
  const dataRows = nodes
    .filter(n => n.id.startsWith('email-'))
    .map(n => [
      n.id,
      (n.data.label as string).replace(/^📧\s*/, ''),
      (n.data.subject as string) || '',
      (n.data.preview as string) || '',
      (n.data.body as string) || '',
    ].map(esc).join(','));
  return [header, ...dataRows].join('\n');
}

function buildYourHQNodes(): Node[] {
  return [
    { id: 'trigger',      position: { x: 450, y: 0    }, data: { label: '⚡ Trigger: Manual / CSV Import' }, style: nodeStyles.trigger },
    { id: 'email-1',      position: { x: 450, y: 130  }, data: {
      label: '📧 Email 1: Initial Outreach (Day 1)',
      subject: 'your google reviews vs your website',
      preview: 'You\'ve done the hard work. But is anyone finding you online?',
      body: `Hey,\n\nSaw {{Company Name}} on Google while doing some research on {{City}} auto businesses. You've got {{Reviews}} reviews — that's solid.\n\nBut when I clicked through, there's no website link. Or it goes to a Facebook page that hasn't been updated in months.\n\nHere's the thing: those {{Reviews}} reviews are doing heavy lifting. But every time someone's ready to book and can't find a proper website, you're handing jobs to whoever shows up online instead.\n\nI run YourHQ — we build professional websites for tradies in 5 days. No Wix. No homework. Just one 15-minute phone call and we handle the rest.\n\nNot pitching you yet. Just planting a seed. If sorting your website's on the radar for 2026, keen to have a quick chat.\n\nCheers,\nLian\nYourHQ\n022 172 5793`,
    }, style: nodeStyles.email },
    { id: 'wait-1',       position: { x: 450, y: 310  }, data: { label: '⏳ Wait 3 Days' }, style: nodeStyles.delay },
    { id: 'condition-1',  position: { x: 450, y: 440  }, data: { label: '🔀 Opened Email 1? → Yes / No' }, style: nodeStyles.condition },

    // — Opened branch (Left) ————————————————————————————
    { id: 'email-2a',     position: { x: 100, y: 600  }, data: {
      label: '📧 Email 2A: Engaged Follow-Up (Day 4)',
      subject: 'couple things i should\'ve mentioned',
      preview: 'We\'re not an agency. And you do literally nothing.',
      body: `Hey,\n\nQuick follow-up on my email earlier this week about {{Company Name}}'s website.\n\nA couple things I probably should've mentioned:\n\n**One:** We're not an agency. I'm Kiwi, based in Whangārei, and I built YourHQ specifically for tradies who are sick of being told they need to "learn Wix."\n\n**Two:** You literally do nothing. We have an AI phone call that asks you about your business — takes 15 minutes. We pull photos from your Facebook, scrape your {{Reviews}} Google reviews, and build the site. Zero homework.\n\n**Three:** We don't ghost. Most agencies build your site and disappear. We stay on as caretakers. Forever. Updates, changes, maintenance — all included.\n\nIf you're curious what this actually looks like, here's a site we built for a commercial builder in Whangārei: https://yourhq.co.nz/demo\n\nWorth a 5-minute chat? I can get Nic (our sales partner) to call you next week at smoko if that works.\n\nCheers,\nLian`,
    }, style: nodeStyles.email },
    { id: 'wait-2a',      position: { x: 100, y: 780  }, data: { label: '⏳ Wait 4 Days' }, style: nodeStyles.delay },
    { id: 'condition-2a', position: { x: 100, y: 910  }, data: { label: '🔀 Opened Email 2A? → Yes / No' }, style: nodeStyles.condition },
    { id: 'email-3a',     position: { x: 100, y: 1070 }, data: {
      label: '📧 Email 3A: Social Proof (Day 8)',
      subject: 'what reuben said',
      preview: 'This is the vibe for {{Company Name}} too.',
      body: `Hey,\n\nStill on the fence? I get it.\n\nHere's what Reuben (Johnson & Sons, commercial builder) said after we built his site:\n\n"Building a website was my barrier to market. You helped me fulfill a dream. It's not just a website — it's a digital handshake that matches the quality of my work."\n\nThat's the vibe for {{Company Name}} too. Not a flashy corporate site. Not a half-done Wix job. A professional digital home that actually looks like the business you've built.\n\nWe've got 26 Founding Member spots at 50% off setup — locked-in pricing for life. Already taken 3. Once they're gone, full price.\n\nIf you want one of those spots, Nic will call you this week. Just reply "yeah" and I'll pass your number to her.\n\nCheers,\nLian`,
    }, style: nodeStyles.email },
    { id: 'wait-3a',      position: { x: 100, y: 1250 }, data: { label: '⏳ Wait 6 Days' }, style: nodeStyles.delay },
    { id: 'condition-3a', position: { x: 100, y: 1380 }, data: { label: '🔀 Opened 3A (no reply)? → Yes / No' }, style: nodeStyles.condition },
    { id: 'email-4a',     position: { x: 100, y: 1540 }, data: {
      label: '📧 Email 4A: Closing the Books (Day 14)',
      subject: 'closing the books',
      preview: 'Last one — 23 Founding Member spots left.',
      body: `Hey,\n\nClosing the books on outreach for the week, so this is the last you'll hear from me.\n\nI reached out because you've clearly built something solid — {{Reviews}} Google reviews prove it. But every day you don't have a professional website, you're invisible to people who don't already know you.\n\nWe're down to 23 Founding Member spots. Once we hit 26, this offer's gone.\n\nIf you want one, reply to this email or text me: 022 172 5793.\n\nIf not, all good. Keep doing what you're doing — and best of luck with the business.\n\nCheers,\nLian\nYourHQ`,
    }, style: nodeStyles.email },

    // — Not opened branch (Right) ——————————————————————
    { id: 'email-2b',     position: { x: 800, y: 600  }, data: {
      label: '📧 Email 2B: Re-Engagement (Day 4)',
      subject: 'google is expensive advertising',
      preview: 'Every search is traffic you\'re not getting.',
      body: `Hey,\n\nQuick thought.\n\nIf someone in {{City}} Googles "{{Type}} near me" and you don't show up — you're basically paying for advertising you're not getting.\n\nYou've got {{Reviews}} Google reviews. That's proof you do good work. But without a website, every month is free Google traffic you're leaving on the table.\n\nI run YourHQ. We build professional websites for tradies in 5 days — no tech headaches, no homework. One phone call. That's it.\n\nNot trying to sell you anything today. Just planting a seed. If you're keen to stop handing Google traffic to your competitors, let's chat.\n\nCheers,\nLian\nYourHQ\n022 172 5793`,
    }, style: nodeStyles.email },
    { id: 'wait-2b',      position: { x: 800, y: 780  }, data: { label: '⏳ Wait 4 Days' }, style: nodeStyles.delay },
    { id: 'condition-2b', position: { x: 800, y: 910  }, data: { label: '🔀 Opened Email 2B? → Yes / No' }, style: nodeStyles.condition },
    { id: 'email-3b',     position: { x: 650, y: 1070 }, data: {
      label: '📧 Email 3B: Last Shot (Day 8)',
      subject: 'last email, promise',
      preview: 'One phone call. 15 minutes. Website live in 5 days.',
      body: `Hey,\n\nLast email from me, promise.\n\nHere's the reality: I'm not chasing you. You're busy. I get it.\n\nBut if you've got "sort the website" sitting on your mental to-do list for the last 6 months, here's your out:\n\nOne phone call. 15 minutes. We handle everything else. Website live in 5 days. We stay on forever as caretakers.\n\nNo Wix. No DIY. No learning curves.\n\nWe've got 26 Founding Member spots at 50% off. When they're gone, full price kicks in.\n\nIf you want one, reply to this and I'll get Nic to call you.\n\nIf not, no stress — I'll stop filling your inbox.\n\nCheers,\nLian`,
    }, style: nodeStyles.email },
    { id: 'wait-3b',      position: { x: 650, y: 1250 }, data: { label: '⏳ Wait 6 Days' }, style: nodeStyles.delay },
    { id: 'email-4b-sent',position: { x: 650, y: 1380 }, data: {
      label: '📧 Email 4B: Archive (Day 14)',
      subject: 'unsubscribing you',
      preview: 'No stress — all good.',
      body: `Hey,\n\nHaven't heard from you, so I'm taking you off my outreach list.\n\nIf you ever decide to sort your website, we're here: yourhq.co.nz\n\nAll good either way.\n\nCheers,\nLian`,
    }, style: nodeStyles.email },
    { id: 'email-4b-skip', position: { x: 950, y: 1070 }, data: {
      label: '📧 Email 4B: Archive (Day 14)',
      subject: 'unsubscribing you',
      preview: 'No stress — all good.',
      body: `Hey,\n\nHaven't heard from you, so I'm taking you off my outreach list.\n\nIf you ever decide to sort your website, we're here: yourhq.co.nz\n\nAll good either way.\n\nCheers,\nLian`,
    }, style: nodeStyles.email },
  ];
}

function buildYourHQEdges(): Edge[] {
  return [
    { id: 'e1',  source: 'trigger',      target: 'email-1',      animated: true, style: { stroke: '#2D6BFF', strokeWidth: 2 } },
    { id: 'e2',  source: 'email-1',      target: 'wait-1',                       style: { stroke: '#64748B', strokeWidth: 2 } },
    { id: 'e3',  source: 'wait-1',       target: 'condition-1',  animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },

    // Condition 1 → 2A / 2B
    { id: 'e4a', source: 'condition-1',  target: 'email-2a',     animated: true, label: 'Yes (Opened)',     style: { stroke: '#2D6BFF', strokeWidth: 2 } },
    { id: 'e4b', source: 'condition-1',  target: 'email-2b',     animated: true, label: 'No (Not Opened)', style: { stroke: '#64748B', strokeWidth: 2 } },

    // 2A branch
    { id: 'e5a', source: 'email-2a',     target: 'wait-2a',                      style: { stroke: '#64748B', strokeWidth: 2 } },
    { id: 'e6a', source: 'wait-2a',      target: 'condition-2a', animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },
    { id: 'e7a', source: 'condition-2a', target: 'email-3a',     animated: true, label: 'Yes (Opened)',     style: { stroke: '#2D6BFF', strokeWidth: 2 } },
    { id: 'e8a', source: 'email-3a',     target: 'wait-3a',                      style: { stroke: '#64748B', strokeWidth: 2 } },
    { id: 'e9a', source: 'wait-3a',      target: 'condition-3a', animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },
    { id: 'e10', source: 'condition-3a', target: 'email-4a',     animated: true, label: 'Yes (Opened)',     style: { stroke: '#2D6BFF', strokeWidth: 2 } },

    // 2B branch
    { id: 'e5b', source: 'email-2b',     target: 'wait-2b',                      style: { stroke: '#64748B', strokeWidth: 2 } },
    { id: 'e6b', source: 'wait-2b',      target: 'condition-2b', animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } },
    { id: 'e7b', source: 'condition-2b', target: 'email-3b',     animated: true, label: 'Yes (Opened)',     style: { stroke: '#2D6BFF', strokeWidth: 2 } },
    { id: 'e7c', source: 'condition-2b', target: 'email-4b-skip',animated: true, label: 'No (Not Opened)', style: { stroke: '#64748B', strokeWidth: 2 } },

    // 3B → 4B
    { id: 'e8b', source: 'email-3b',     target: 'wait-3b',                      style: { stroke: '#64748B', strokeWidth: 2 } },
    { id: 'e9b', source: 'wait-3b',      target: 'email-4b-sent',animated: true, style: { stroke: '#2D6BFF', strokeWidth: 2 } },
  ];
}

function BulkImportModal({ nodes, onApply, onClose }: {
  nodes: Node[];
  onApply: (updates: Record<string, { subject: string; preview: string; body: string }>) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const csv = generateCSVTemplate(nodes);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'email-flow-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) { setError('CSV appears to be empty.'); return; }
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const idx = (col: string) => headers.indexOf(col);
        const idIdx = idx('email_id');
        if (idIdx === -1) { setError('Missing required column: email_id'); return; }
        const updates: Record<string, { subject: string; preview: string; body: string }> = {};
        for (const row of rows.slice(1)) {
          const id = row[idIdx]?.trim();
          if (!id) continue;
          updates[id] = {
            subject: row[idx('subject')] ?? '',
            preview: row[idx('preview_text')] ?? '',
            body: row[idx('body')] ?? '',
          };
        }
        onApply(updates);
        onClose();
      } catch {
        setError('Could not parse the CSV. Please use the template.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-paper rounded-2xl shadow-xl w-full max-w-md border border-surface-mist">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-mist">
          <h2 className="text-base font-semibold text-content-ink">Bulk Import Emails</h2>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink p-1 rounded hover:bg-surface-mist transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-surface-cloud border border-surface-mist rounded-xl p-4">
            <p className="text-sm font-medium text-content-ink mb-1">Step 1 — Download the template</p>
            <p className="text-xs text-content-slate mb-3">Fill in your subject lines, preview text, and email body for each email in a spreadsheet, then save as CSV.</p>
            <button
              onClick={downloadTemplate}
              className="flex items-center text-xs font-medium px-3 py-2 rounded-lg bg-white border border-surface-mist hover:border-brand-storm text-content-ink transition-colors shadow-sm"
            >
              <Download size={13} className="mr-1.5" /> Download CSV Template
            </button>
          </div>

          <div className="bg-surface-cloud border border-surface-mist rounded-xl p-4">
            <p className="text-sm font-medium text-content-ink mb-1">Step 2 — Upload your filled CSV</p>
            <p className="text-xs text-content-slate mb-3">Your content will be mapped to each email step automatically.</p>
            <label className="flex items-center text-xs font-medium px-3 py-2 rounded-lg bg-white border border-surface-mist hover:border-brand-storm text-content-ink transition-colors shadow-sm cursor-pointer w-fit">
              <Upload size={13} className="mr-1.5" /> Choose CSV File
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DragItem({ type, icon, label }: { type: string; icon: React.ReactNode; label: string }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 border border-surface-mist rounded-lg bg-surface-cloud flex items-center cursor-grab active:cursor-grabbing hover:border-brand-storm hover:bg-brand-glow/30 transition-colors select-none"
    >
      {icon}
      <span className="text-sm font-medium text-content-ink">{label}</span>
    </div>
  );
}

let nodeIdCounter = 10;

function FlowCanvas({ nodes, setNodes, edges, setEdges, onNodeClick }: {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), [setEdges]
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#2D6BFF', strokeWidth: 2 } }, eds)), [setEdges]
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },[]);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const step = stepTypes.find(s => s.type === type);
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${type}-${++nodeIdCounter}`;
    const newNode: Node = {
      id,
      position,
      data: { label: step?.defaultLabel ?? type, subject: '', body: '' },
      style: nodeStyles[type] ?? nodeStyles.email,
    };
    setNodes(nds => [...nds, newNode]);
  },[screenToFlowPosition, setNodes]);

  return (
    <div ref={wrapperRef} className="flex-1 relative bg-surface-cloud">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick} // Wires up the click!
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function FlowBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const template = searchParams.get('template');
  const isNurture = template === 'nurture';
  const isYourHQ = template === 'yourhq';
  const editId = searchParams.get('id');

  const[nodes, setNodes] = useState<Node[]>(() =>
    isNurture ? buildNurtureNodes() : isYourHQ ? buildYourHQNodes() : initialNodes
  );
  const [edges, setEdges] = useState<Edge[]>(() =>
    isNurture ? buildNurtureEdges() : isYourHQ ? buildYourHQEdges() : initialEdges
  );

  // Track which node is selected to show the right panel
  const[selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [flowName, setFlowName] = useState(
    isNurture ? 'Magic Lantern Nurture Flow' : isYourHQ ? 'YourHQ Cold Outreach' : 'New Welcome Sequence'
  );
  const[triggerType, setTriggerType] = useState(isYourHQ ? 'manual' : 'new_contact');
  const [triggerTag, setTriggerTag] = useState('');
  const [sendDays, setSendDays] = useState<string[]>(['tuesday', 'thursday']);
  const[sendTime, setSendTime] = useState('10:00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'activated'>('idle');
  const [showImport, setShowImport] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Tracks the current flow ID — either from URL or created on first autosave
  const savedFlowIdRef = useRef<string | null>(editId);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);
  // Prevents autosave from firing while we're loading an existing flow's data
  const isLoadingFlow = useRef(!!editId);

  // Load existing flow data when opening an existing flow by ID
  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/flows/${editId}`);
        const { success, data } = await res.json();
        if (success && data) {
          setFlowName(data.name ?? 'Untitled Flow');
          setNodes(data.nodes ?? initialNodes);
          setEdges(data.edges ?? initialEdges);
          setTriggerType(data.trigger_type ?? 'new_contact');
          setTriggerTag(data.trigger_tag ?? '');
          setSendDays(data.send_days ?? ['tuesday', 'thursday']);
          setSendTime(data.send_time ?? '10:00');
        }
      } finally {
        isLoadingFlow.current = false;
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    if (isLoadingFlow.current) return;
    setAutoSaveStatus('idle');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const payload = {
          name: flowName, trigger_type: triggerType, trigger_tag: triggerTag || null,
          nodes, edges, status: 'draft', send_days: sendDays, send_time: sendTime,
        };
        const id = savedFlowIdRef.current;
        const res = await fetch(id ? `/api/flows/${id}` : '/api/flows', {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const { success, data } = await res.json();
        if (success) {
          if (!id && data?.id) {
            savedFlowIdRef.current = data.id;
            router.replace(`/flows/new?id=${data.id}`, { scroll: false });
          }
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2500);
        }
      } catch { setAutoSaveStatus('idle'); }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, flowName, triggerType, triggerTag, sendDays, sendTime]);

  const toggleDay = (day: string) => {
    setSendDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // When a node is clicked, if it's an email, open the side panel
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('email')) {
      setSelectedNodeId(node.id);
    } else {
      setSelectedNodeId(null);
    }
  },[]);

  const updateNodeData = useCallback((id: string, data: { subject: string; preview: string; body: string }) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  const applyBulkImport = useCallback((updates: Record<string, { subject: string; preview: string; body: string }>) => {
    setNodes(nds => nds.map(n => updates[n.id] ? { ...n, data: { ...n.data, ...updates[n.id] } } : n));
  }, []);

  const saveFlow = async (activate: boolean) => {
    setIsSaving(true);
    try {
      const payload = {
        name: flowName,
        trigger_type: triggerType,
        trigger_tag: triggerTag || null,
        nodes,
        edges,
        status: activate ? 'active' : 'draft',
        send_days: sendDays,
        send_time: sendTime,
      };

      const id = savedFlowIdRef.current;
      const url = id ? `/api/flows/${id}` : '/api/flows';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const { success, data } = await res.json();
      if (success) {
        if (!id && data?.id) {
          savedFlowIdRef.current = data.id;
          router.replace(`/flows/new?id=${data.id}`, { scroll: false });
        }
        setSaveState(activate ? 'activated' : 'saved');
        setTimeout(() => {
          setSaveState('idle');
          if (activate) router.push('/flows');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save flow.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <main className="flex flex-col h-screen bg-surface-cloud overflow-hidden w-full">
      <header className="h-16 bg-surface-paper border-b border-surface-mist flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center flex-1">
          <Link href="/flows" className="text-content-slate hover:text-brand-storm transition-colors mr-4">
            <ArrowLeft size={20} />
          </Link>
          <input
            type="text"
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            className="text-lg font-semibold text-content-ink bg-transparent border-none focus:ring-0 outline-none w-96"
          />
          {isNurture && (
            <span className="ml-3 text-xs font-medium px-2 py-1 bg-brand-glow text-brand-storm rounded-full border border-brand-storm/20 flex items-center">
              <Zap size={10} className="mr-1" /> Magic Lantern Template
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-content-slate flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check size={12} /> Autosaved
            </span>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="border border-surface-mist text-content-slate hover:text-content-ink hover:bg-surface-mist px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm"
            title="Bulk import email copy from CSV"
          >
            <Upload size={15} className="mr-1.5" /> Import CSV
          </button>
          <button
            onClick={() => saveFlow(false)}
            disabled={isSaving}
            className="bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50"
          >
            {isSaving && saveState !== 'activated' ? <Loader2 size={16} className="mr-2 animate-spin" /> :
             saveState === 'saved' ? <Check size={16} className="mr-2 text-green-600" /> :
             <Save size={16} className="mr-2" />}
            {saveState === 'saved' ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={() => saveFlow(true)}
            disabled={isSaving}
            className="bg-brand-storm hover:bg-brand-indigo text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50"
          >
            {saveState === 'activated' ? <Check size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
            {saveState === 'activated' ? 'Activated!' : 'Turn On Flow'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Settings & Drag Items */}
        <aside className="w-64 bg-surface-paper border-r border-surface-mist flex flex-col overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-4 border-b border-surface-mist">
            <h3 className="text-xs font-bold text-content-slate uppercase tracking-wider mb-1">Flow Steps</h3>
            <p className="text-xs text-content-slate mb-4">Drag a step onto the canvas</p>
            <div className="space-y-3">
              {stepTypes.map(s => (
                <DragItem key={s.type} type={s.type} icon={s.icon} label={s.label} />
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-surface-mist">
            <h3 className="text-xs font-bold text-content-slate uppercase tracking-wider mb-3">Trigger</h3>
            <select
              value={triggerType}
              onChange={e => setTriggerType(e.target.value)}
              className="w-full text-xs border border-surface-mist rounded-md px-2 py-1.5 outline-none focus:border-brand-storm bg-white mb-2"
            >
              <option value="new_contact">New Contact Added</option>
              <option value="tag">Tag Applied</option>
              <option value="post_purchase">Post-Purchase</option>
              <option value="manual">Manual / API</option>
            </select>
            {triggerType === 'tag' && (
              <input
                type="text"
                placeholder="Tag name (e.g. new-lead)"
                value={triggerTag}
                onChange={e => setTriggerTag(e.target.value)}
                className="w-full text-xs border border-surface-mist rounded-md px-2 py-1.5 outline-none focus:border-brand-storm"
              />
            )}
          </div>

          <div className="p-4 border-b border-surface-mist">
            <h3 className="text-xs font-bold text-content-slate uppercase tracking-wider mb-3">Send Schedule</h3>
            <p className="text-xs text-content-slate mb-2">Preferred send days</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {SEND_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                    sendDays.includes(day)
                      ? 'bg-brand-storm text-white border-brand-storm'
                      : 'bg-surface-cloud text-content-slate border-surface-mist hover:border-brand-storm'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="text-xs text-content-slate mb-2">Send time</p>
            <select
              value={sendTime}
              onChange={e => setSendTime(e.target.value)}
              className="w-full text-xs border border-surface-mist rounded-md px-2 py-1.5 outline-none focus:border-brand-storm bg-white"
            >
              {SEND_TIMES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Center - Visual Canvas */}
        <FlowCanvas 
          nodes={nodes} 
          setNodes={setNodes} 
          edges={edges} 
          setEdges={setEdges} 
          onNodeClick={handleNodeClick} 
        />

        {/* Right Sidebar - Email Details (Shows only when an email node is clicked) */}
        {selectedNode && (
          <EmailDetailPanel
            key={selectedNode.id}
            node={selectedNode}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {showImport && (
        <BulkImportModal
          nodes={nodes}
          onApply={applyBulkImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </main>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-surface-cloud">
          <Loader2 className="animate-spin text-content-slate" size={28} />
        </div>
      }>
        <FlowBuilderContent />
      </Suspense>
    </ReactFlowProvider>
  );
}