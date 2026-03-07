"use client";

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Send, Loader2, Sparkles, Mail, FlipHorizontal, SplitSquareHorizontal, Save, Tag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TOKENS = [
  { label: '{{firstName}}', title: 'First Name' },
  { label: '{{company}}', title: 'Company' },
];

type FlowItem = { id: string; name: string };

function BroadcastComposerContent() {
  const searchParams = useSearchParams();
  const initialFramework = searchParams.get('framework') || 'story';

  const [subject, setSubject] = useState('');
  const [testEmail, setTestEmail] = useState('lian@yourhq.co.nz');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const [topic, setTopic] = useState('');
  const [framework, setFramework] = useState(initialFramework);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBody, setGeneratedBody] = useState('');

  const [isPlainText, setIsPlainText] = useState(false);
  const [abEnabled, setAbEnabled] = useState(false);
  const [subjectB, setSubjectB] = useState('');
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [flows, setFlows] = useState<FlowItem[]>([]);

  useEffect(() => {
    fetch('/api/flows').then(r => r.json()).then(({ data }) => setFlows(data || []));
  }, []);

  const addSegmentTag = () => {
    const tag = tagInput.trim();
    if (tag && !segmentTags.includes(tag)) setSegmentTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedBody('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, framework }),
      });
      const { success, data } = await res.json();
      if (success) { setSubject(data.subject || ''); setGeneratedBody(data.body || ''); }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !subject) { alert("Add a subject and test email first."); return; }
    setIsSending(true);
    setSendSuccess(false);
    const html = `<div style="font-family:sans-serif;padding:40px;background:#F6F7FB;"><div style="background:white;padding:30px;border-radius:8px;max-width:600px;margin:0 auto;border:1px solid #E6EAF2;"><h2 style="color:#0F172A;margin-top:0;">${subject}</h2><div style="color:#64748B;font-size:16px;line-height:1.6;">${generatedBody || 'Test from Signal by DreamStorm.'}</div></div></div>`;
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, subject, html, isPlainText }),
      });
      if (res.ok) { setSendSuccess(true); setTimeout(() => setSendSuccess(false), 3000); }
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    if (!subject || !generatedBody) { alert("Generate copy first."); return; }
    setIsSaving(true);
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body_html: generatedBody, framework, is_plain_text: isPlainText,
          ab_subject_b: abEnabled ? subjectB : null, segment_tags: segmentTags,
        }),
      });
      const { success, data } = await res.json();
      if (success) { setSavedId(data.id); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAll = async () => {
    if (!savedId) { alert("Save the broadcast first."); return; }
    const tagNote = segmentTags.length ? ` to segment: ${segmentTags.join(', ')}` : ' to your full audience';
    if (!confirm(`Send this broadcast${tagNote}?`)) return;
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

  const previewDocument = generatedBody
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:-apple-system,sans-serif;margin:0;padding:0;background:#F6F7FB;}
        .wrapper{max-width:600px;margin:32px auto;background:white;border-radius:8px;border:1px solid #E6EAF2;overflow:hidden;}
        .email-header{padding:24px 32px 16px;border-bottom:1px solid #E6EAF2;}
        .email-subject{font-size:18px;font-weight:600;color:#0F172A;margin:0;}
        .email-body{padding:24px 32px 32px;color:#334155;font-size:15px;line-height:1.7;}
        .email-body p{margin:0 0 1em;} .email-body b{color:#0F172A;}
      </style></head><body>
        <div class="wrapper">
          <div class="email-header"><p class="email-subject">${subject || '(No subject)'}</p></div>
          <div class="email-body">${generatedBody}</div>
        </div></body></html>`
    : '';

  return (
    <div className="flex flex-col h-screen bg-surface-cloud overflow-hidden w-full">
      <header className="h-16 bg-surface-paper border-b border-surface-mist flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center flex-1">
          <Link href="/broadcasts" className="text-content-slate hover:text-brand-storm transition-colors mr-4">
            <ArrowLeft size={20} />
          </Link>
          <input
            type="text"
            placeholder="Subject line... (use {{firstName}} to personalize)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-lg font-semibold text-content-ink bg-transparent border-none focus:ring-0 outline-none w-full max-w-2xl placeholder:text-gray-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlainText(!isPlainText)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${isPlainText ? 'bg-content-ink text-white border-content-ink' : 'bg-surface-cloud border-surface-mist text-content-slate hover:border-content-ink'}`}>
            <FlipHorizontal size={13} />{isPlainText ? 'Plain Text' : 'HTML'}
          </button>
          <button onClick={() => setAbEnabled(!abEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${abEnabled ? 'bg-purple-600 text-white border-purple-600' : 'bg-surface-cloud border-surface-mist text-content-slate hover:border-purple-400'}`}>
            <SplitSquareHorizontal size={13} />A/B
          </button>
          <div className="w-px h-5 bg-surface-mist mx-1" />
          <div className="text-xs font-medium text-content-slate">Test:</div>
          <input type="email" placeholder="your@email.com" value={testEmail} onChange={e => setTestEmail(e.target.value)}
            className="text-sm border border-surface-mist rounded-md px-3 py-2 w-44 focus:border-brand-storm outline-none" />
          <button onClick={handleSendTest} disabled={isSending}
            className={`px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center disabled:opacity-50 ${sendSuccess ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'}`}>
            {isSending ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : sendSuccess ? <span className="mr-1.5">✓</span> : <Send size={15} className="mr-1.5" />}
            {sendSuccess ? 'Sent' : 'Test'}
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className={`px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'}`}>
            {isSaving ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : saveSuccess ? <span className="mr-1.5">✓</span> : <Save size={15} className="mr-1.5" />}
            {saveSuccess ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleSendAll} disabled={isBroadcasting || !savedId}
            className={`px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50 ${broadcastSuccess ? 'bg-green-500 text-white' : 'bg-brand-storm hover:bg-brand-indigo text-white'}`}>
            {isBroadcasting ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Send size={15} className="mr-1.5" />}
            {broadcastSuccess ? 'Sent!' : 'Send Broadcast'}
          </button>
        </div>
      </header>

      {abEnabled && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-2.5 flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-purple-700 shrink-0">Subject B:</span>
          <input type="text" placeholder="Alternate subject for A/B test..." value={subjectB} onChange={e => setSubjectB(e.target.value)}
            className="flex-1 text-sm bg-white border border-purple-200 rounded-md px-3 py-1.5 outline-none focus:border-purple-500 max-w-xl" />
          <span className="text-xs text-purple-500 shrink-0">50/50 split · winner by open rate after 4h</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-surface-paper border-r border-surface-mist flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-y-auto">
          {/* AI Engine */}
          <div className="p-5 border-b border-surface-mist bg-brand-glow/30">
            <div className="flex items-center text-brand-storm font-semibold mb-4">
              <Sparkles size={18} className="mr-2" /> Sabri Suby Engine
            </div>
            <p className="text-xs font-medium text-content-slate mb-2 uppercase tracking-wider">Framework</p>
            <select value={framework} onChange={e => setFramework(e.target.value)}
              className="w-full bg-white border border-surface-mist text-sm rounded-md px-3 py-2 mb-4 outline-none focus:border-brand-storm">
              <option value="story">The Story Lead-In (Light)</option>
              <option value="objection">The Objection Crusher (Light)</option>
              <option value="deadline">The Hard Deadline (Shade)</option>
              <option value="godfather">The Godfather Offer (Shade)</option>
            </select>
            <p className="text-xs font-medium text-content-slate mb-2 uppercase tracking-wider">Offer / Topic</p>
            <textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Free roof inspection for winter. Valued at $150. Limited to first 10 replies."
              className="w-full h-24 p-3 text-sm border border-surface-mist rounded-lg focus:border-brand-storm outline-none resize-none bg-white mb-4" />
            <button onClick={handleGenerateAI} disabled={isGenerating || !topic}
              className="w-full bg-content-ink hover:bg-black text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50">
              {isGenerating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              {isGenerating ? "Writing copy..." : "Generate Copy"}
            </button>
          </div>

          {/* Tokens */}
          <div className="p-5 border-b border-surface-mist">
            <p className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-3">Personalization</p>
            <div className="flex flex-wrap gap-2">
              {TOKENS.map(t => (
                <button key={t.label} onClick={() => setSubject(prev => prev + t.label)}
                  className="px-2.5 py-1 text-xs font-mono bg-brand-glow text-brand-storm border border-brand-storm/20 rounded-md hover:bg-brand-storm hover:text-white transition-colors">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Segment targeting */}
          <div className="p-5">
            <p className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-3">Audience Segment</p>
            <p className="text-xs text-content-slate mb-3 leading-relaxed">
              Leave empty to send to <strong>all contacts</strong>. Add tags to target a specific segment.
            </p>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Tag name..." value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSegmentTag()}
                className="flex-1 text-xs border border-surface-mist rounded-md px-2.5 py-1.5 outline-none focus:border-brand-storm" />
              <button onClick={addSegmentTag}
                className="px-3 py-1.5 bg-surface-cloud border border-surface-mist rounded-md text-xs font-medium hover:bg-surface-mist transition-colors">
                <Tag size={12} />
              </button>
            </div>
            {segmentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {segmentTags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-brand-glow text-brand-storm border border-brand-storm/20 rounded-md text-xs font-medium">
                    {tag}
                    <button onClick={() => setSegmentTags(prev => prev.filter(t => t !== tag))} className="ml-1.5 hover:text-brand-indigo">×</button>
                  </span>
                ))}
              </div>
            )}
            {flows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface-mist">
                <p className="text-xs text-content-slate mb-1">Or add to a Flow instead:</p>
                <select className="w-full text-xs border border-surface-mist rounded-md px-2 py-1.5 outline-none focus:border-brand-storm bg-white">
                  <option value="">— select flow —</option>
                  {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 relative bg-surface-cloud flex flex-col overflow-hidden">
          {generatedBody ? (
            <iframe srcDoc={previewDocument} className="flex-1 w-full border-0" title="Email Preview" sandbox="allow-same-origin" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-surface-paper rounded-full flex items-center justify-center mb-5 shadow-sm border border-surface-mist">
                <Mail className="text-content-slate opacity-40" size={28} />
              </div>
              <h3 className="text-base font-semibold text-content-ink mb-1">Your email preview will appear here</h3>
              <p className="text-sm text-content-slate max-w-xs">Select a framework, describe your offer, then hit Generate Copy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BroadcastComposer() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-content-slate">Loading...</div>}>
      <BroadcastComposerContent />
    </Suspense>
  );
}
