"use client";

import { useState, Suspense } from 'react';
import { ArrowLeft, Send, Loader2, Sparkles, Mail, FlipHorizontal, SplitSquareHorizontal, Save } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TOKENS = [
  { label: '{{firstName}}', title: 'First Name' },
  { label: '{{company}}', title: 'Company' },
  { label: '{{role}}', title: 'Role' },
];

function EditorContent() {
  const searchParams = useSearchParams();
  const initialFramework = searchParams.get('framework') || 'story';

  const [subject, setSubject] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [topic, setTopic] = useState('');
  const [framework, setFramework] = useState(initialFramework);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBody, setGeneratedBody] = useState('');

  const [isPlainText, setIsPlainText] = useState(false);
  const [abEnabled, setAbEnabled] = useState(false);
  const [subjectB, setSubjectB] = useState('');

  const insertToken = (token: string) => {
    setSubject(prev => prev + token);
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

      if (success) {
        setSubject(data.subject || '');
        setGeneratedBody(data.body || '');
      } else {
        alert('Failed to generate copy. Check terminal.');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong contacting Claude.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !subject) {
      alert("Please add a subject and a test email address.");
      return;
    }
    setIsSending(true);
    setSendSuccess(false);

    const wrapperHtml = `<div style="font-family: sans-serif; padding: 40px; background: #F6F7FB;">
      <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #E6EAF2;">
        <h2 style="color: #0F172A; margin-top: 0;">${subject}</h2>
        <div style="color: #64748B; font-size: 16px; line-height: 1.6;">
          ${generatedBody || 'This is a test from Signal by DreamStorm.'}
        </div>
      </div>
    </div>`;

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, subject, html: wrapperHtml, isPlainText }),
      });

      if (response.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        alert("Failed to send.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAsBroadcast = async () => {
    if (!subject || !generatedBody) {
      alert("Generate copy first before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body_html: generatedBody,
          framework,
          is_plain_text: isPlainText,
          ab_subject_b: abEnabled ? subjectB : null,
        }),
      });
      const { success } = await res.json();
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const previewDocument = generatedBody
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 0; background: #F6F7FB; }
        .wrapper { max-width: 600px; margin: 32px auto; background: white; border-radius: 8px; border: 1px solid #E6EAF2; overflow: hidden; }
        .email-header { padding: 24px 32px 16px; border-bottom: 1px solid #E6EAF2; }
        .email-subject { font-size: 18px; font-weight: 600; color: #0F172A; margin: 0; }
        .email-body { padding: 24px 32px 32px; color: #334155; font-size: 15px; line-height: 1.7; white-space: ${isPlainText ? 'pre-wrap' : 'normal'}; font-family: ${isPlainText ? 'monospace' : 'inherit'}; }
        .email-body p { margin: 0 0 1em; }
        .email-body b { color: #0F172A; }
      </style></head><body>
        <div class="wrapper">
          <div class="email-header"><p class="email-subject">${subject || '(No subject)'}</p></div>
          <div class="email-body">${generatedBody}</div>
        </div>
      </body></html>`
    : '';

  return (
    <div className="flex flex-col h-screen bg-surface-cloud overflow-hidden w-full">
      {/* Top Bar */}
      <header className="h-16 bg-surface-paper border-b border-surface-mist flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center flex-1">
          <Link href="/blueprints" className="text-content-slate hover:text-brand-storm transition-colors mr-4">
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
          <button
            onClick={() => setIsPlainText(!isPlainText)}
            title="Toggle plain text mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isPlainText
                ? 'bg-content-ink text-white border-content-ink'
                : 'bg-surface-cloud border-surface-mist text-content-slate hover:border-content-ink'
            }`}
          >
            <FlipHorizontal size={13} />
            {isPlainText ? 'Plain Text' : 'HTML'}
          </button>

          <button
            onClick={() => setAbEnabled(!abEnabled)}
            title="Toggle A/B test"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              abEnabled
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-surface-cloud border-surface-mist text-content-slate hover:border-purple-400'
            }`}
          >
            <SplitSquareHorizontal size={13} />
            A/B
          </button>

          <div className="text-xs font-medium text-content-slate ml-1">Pre-flight:</div>
          <input
            type="email"
            placeholder="Send test to..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="text-sm border border-surface-mist rounded-md px-3 py-2 w-48 focus:border-brand-storm outline-none"
          />
          <button
            onClick={handleSendTest}
            disabled={isSending}
            className={`px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50 ${
              sendSuccess ? 'bg-green-500 text-white' : 'bg-brand-storm hover:bg-brand-indigo text-white'
            }`}
          >
            {isSending ? <Loader2 size={15} className="mr-1.5 animate-spin" /> :
             sendSuccess ? <span className="mr-1.5">✓</span> :
             <Send size={15} className="mr-1.5" />}
            {sendSuccess ? "Sent" : "Test"}
          </button>
          <button
            onClick={handleSaveAsBroadcast}
            disabled={isSaving}
            className={`px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm disabled:opacity-50 ${
              saveSuccess ? 'bg-green-500 text-white' : 'bg-surface-cloud border border-surface-mist text-content-ink hover:bg-surface-mist'
            }`}
          >
            {isSaving ? <Loader2 size={15} className="mr-1.5 animate-spin" /> :
             saveSuccess ? <span className="mr-1.5">✓</span> :
             <Save size={15} className="mr-1.5" />}
            {saveSuccess ? "Saved" : "Save Broadcast"}
          </button>
        </div>
      </header>

      {/* A/B Subject B row */}
      {abEnabled && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-2.5 flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-purple-700 shrink-0">Subject B:</span>
          <input
            type="text"
            placeholder="Alternate subject line for A/B test..."
            value={subjectB}
            onChange={(e) => setSubjectB(e.target.value)}
            className="flex-1 text-sm bg-white border border-purple-200 rounded-md px-3 py-1.5 outline-none focus:border-purple-500 max-w-xl"
          />
          <span className="text-xs text-purple-500 shrink-0">50/50 split — winner auto-selected by open rate after 4h</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 bg-surface-paper border-r border-surface-mist flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-y-auto">
          {/* AI Engine */}
          <div className="p-5 border-b border-surface-mist bg-brand-glow/30">
            <div className="flex items-center text-brand-storm font-semibold mb-4">
              <Sparkles size={18} className="mr-2" /> Sabri Suby Engine
            </div>

            <p className="text-xs font-medium text-content-slate mb-2 uppercase tracking-wider">Selected Framework</p>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full bg-white border border-surface-mist text-sm rounded-md px-3 py-2 mb-5 outline-none focus:border-brand-storm"
            >
              <option value="story">The Story Lead-In (Light)</option>
              <option value="objection">The Objection Crusher (Light)</option>
              <option value="deadline">The Hard Deadline (Shade)</option>
              <option value="godfather">The Godfather Offer (Shade)</option>
            </select>

            <p className="text-xs font-medium text-content-slate mb-2 uppercase tracking-wider">What&apos;s the offer/topic?</p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Free roof inspection for winter. Valued at $150. Limited to first 10 replies."
              className="w-full h-28 p-3 text-sm border border-surface-mist rounded-lg focus:border-brand-storm outline-none resize-none bg-white mb-4"
            />

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || !topic}
              className="w-full bg-content-ink hover:bg-black text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              {isGenerating ? "Writing copy..." : "Generate Copy"}
            </button>
          </div>

          {/* Personalization tokens */}
          <div className="p-5">
            <p className="text-xs font-semibold text-content-slate uppercase tracking-wider mb-3">Personalization Tokens</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOKENS.map(t => (
                <button
                  key={t.label}
                  onClick={() => insertToken(t.label)}
                  className="px-2.5 py-1 text-xs font-mono bg-brand-glow text-brand-storm border border-brand-storm/20 rounded-md hover:bg-brand-storm hover:text-white transition-colors"
                  title={`Insert ${t.title} token`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-content-slate leading-relaxed">
              Click a token to add it to the subject line. Claude uses them automatically in generated copy. Replaced with real contact data at send time.
            </p>
          </div>
        </aside>

        {/* Right Panel — Live Email Preview */}
        <div className="flex-1 relative bg-surface-cloud flex flex-col overflow-hidden">
          {generatedBody ? (
            <iframe
              srcDoc={previewDocument}
              className="flex-1 w-full border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-surface-paper rounded-full flex items-center justify-center mb-5 shadow-sm border border-surface-mist">
                <Mail className="text-content-slate opacity-40" size={28} />
              </div>
              <h3 className="text-base font-semibold text-content-ink mb-1">Your email preview will appear here</h3>
              <p className="text-sm text-content-slate max-w-xs">
                Select a framework, describe your offer, then hit <strong>Generate Copy</strong>.
              </p>
              <p className="text-xs text-content-slate mt-3 max-w-xs opacity-70">
                Tokens like <code>&#123;&#123;firstName&#125;&#125;</code> in the copy will be swapped with real subscriber data when you send.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-content-slate">Loading Editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
