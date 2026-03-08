"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Upload, UserPlus, X, Loader2, Check, Workflow, ArrowRightCircle, Ban } from 'lucide-react';

type Prospect = {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  type?: string;
  phone?: string;
  city?: string;
  website?: string;
  source?: string;
  notes?: string;
  tags?: string;
  reviews?: string;
  status: 'not_contacted' | 'contacted' | 'replied' | 'converted' | 'do_not_contact';
  created_at: string;
  last_contacted_at?: string;
  converted_to_lead_id?: string;
};

type Flow = { id: string; name: string; status: string };

const STATUS_STYLES: Record<string, string> = {
  not_contacted: 'bg-surface-cloud text-content-slate border-surface-mist',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  replied: 'bg-green-50 text-green-700 border-green-200',
  converted: 'bg-purple-50 text-purple-700 border-purple-200',
  do_not_contact: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  replied: 'Replied',
  converted: 'Converted',
  do_not_contact: 'Do Not Contact',
};

// ─── Add Prospect Modal ──────────────────────────────────────────────────────

function AddProspectModal({ onClose, onSaved }: { onClose: () => void; onSaved: (p: Prospect) => void }) {
  const [form, setForm] = useState({
    email: '', company: '', source: '', type: '', tags: '', notes: '', phone: '', city: '', reviews: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { setError('Email is required.'); return; }
    setIsSubmitting(true);
    setError('');

    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setIsSubmitting(false);

    if (!json.success) { setError(json.error || 'Something went wrong.'); return; }
    onSaved(json.data as Prospect);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
          <h2 className="text-base font-semibold text-content-ink">Add Prospect</h2>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@acme.com" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Company Name</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Source</label>
              <input value={form.source} onChange={e => set('source', e.target.value)} placeholder="Google Maps, LinkedIn…" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Type</label>
              <input value={form.type} onChange={e => set('type', e.target.value)} placeholder="Restaurant, Agency, SaaS…" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+64 9 000 0000" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Auckland" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Reviews</label>
              <input value={form.reviews} onChange={e => set('reviews', e.target.value)} placeholder="4.8 ★ (120)" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Tag</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Q2, NZ, Hot" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
          </div>
          <div>
            <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Context about this prospect…" rows={2} className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm resize-none" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-content-slate hover:text-content-ink border border-surface-mist rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50">
              {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : <UserPlus size={15} className="mr-2" />}
              {isSubmitting ? 'Saving…' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Import CSV Modal ────────────────────────────────────────────────────────

type CsvRow = Record<string, string>;

function parseCSV(text: string): CsvRow[] {
  // Proper quoted-field parser — handles commas inside quoted fields
  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === ',') { fields.push(field); field = ''; }
        else { field += ch; }
      }
    }
    fields.push(field);
    return fields.map(f => f.trim());
  };

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = parseRow(line);
      const row: CsvRow = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
      return row;
    })
    .filter(row => row['email']);
}

function ImportCSVModal({ onClose, onSaved }: { onClose: () => void; onSaved: (ps: Prospect[]) => void }) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string);
      if (!parsed.length) setError('No valid rows found. Make sure your CSV has a header row with at least an "email" column.');
      else { setError(''); setRows(parsed); }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setIsSubmitting(true);
    setError('');

    const saved: Prospect[] = [];
    let skipped = 0;

    for (const r of rows) {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: r['email'],
          company: r['company name'] || r['company'] || null,
          source: r['source'] || 'CSV Import',
          type: r['type'] || null,
          tags: r['tag'] || r['tags'] || null,
          notes: r['notes'] || null,
          phone: r['phone'] || null,
          city: r['city'] || null,
          reviews: r['reviews'] || null,
        }),
      });
      const json = await res.json();
      if (json.success) saved.push(json.data);
      else skipped++;
    }

    setIsSubmitting(false);
    setResult({ added: saved.length, skipped });
    if (saved.length > 0) onSaved(saved);
  };

  const previewHeaders = rows.length ? Object.keys(rows[0]).slice(0, 6) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
          <h2 className="text-base font-semibold text-content-ink">Import Prospects CSV</h2>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
        </div>
        <div className="p-6">
          {result ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-content-ink font-medium">{result.added} prospects added</p>
              {result.skipped > 0 && <p className="text-content-slate text-sm mt-1">{result.skipped} skipped (duplicates or errors)</p>}
              <button onClick={onClose} className="mt-5 px-5 py-2 bg-brand-storm text-white text-sm font-medium rounded-lg">Done</button>
            </div>
          ) : !rows.length ? (
            <div className="border-2 border-dashed border-surface-mist rounded-xl p-12 text-center cursor-pointer hover:border-brand-storm transition-colors" onClick={() => fileRef.current?.click()}>
              <Upload className="mx-auto text-content-slate mb-3" size={28} />
              <p className="text-sm font-medium text-content-ink">Click to upload a CSV file</p>
              <p className="text-xs text-content-slate mt-1">
                Columns: <span className="font-medium">email</span>, company name, source, type, tag, notes, phone, city, reviews
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-content-ink font-medium">{fileName} — <span className="text-content-slate font-normal">{rows.length} prospects ready</span></p>
                <button onClick={() => { setRows([]); setFileName(''); }} className="text-xs text-content-slate hover:text-content-ink underline">Change file</button>
              </div>
              <div className="border border-surface-mist rounded-lg overflow-hidden mb-1">
                <table className="w-full text-xs">
                  <thead className="bg-surface-cloud text-content-slate uppercase tracking-wider">
                    <tr>{previewHeaders.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-surface-mist">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>{previewHeaders.map(h => <td key={h} className="px-3 py-2 text-content-ink truncate max-w-[120px]">{row[h]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && <p className="text-xs text-content-slate mb-4">…and {rows.length - 5} more rows</p>}
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Duplicates (emails already in Prospects or Audience) will be skipped automatically.
              </p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          {!result && rows.length > 0 && (
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={onClose} className="px-4 py-2 text-sm text-content-slate border border-surface-mist rounded-lg hover:bg-surface-cloud">Cancel</button>
              <button onClick={handleImport} disabled={isSubmitting} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg flex items-center disabled:opacity-50">
                {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
                {isSubmitting ? 'Importing…' : `Import ${rows.length} Prospects`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [enrollingProspect, setEnrollingProspect] = useState<Prospect | null>(null);
  const [enrollFlowId, setEnrollFlowId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [bulkFlowId, setBulkFlowId] = useState('');
  const [bulkEnrolling, setBulkEnrolling] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ enrolled: number; skipped: number } | null>(null);

  const fetchProspects = async () => {
    setIsLoading(true);
    const res = await fetch('/api/prospects');
    const json = await res.json();
    if (json.success) setProspects(json.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProspects();
    fetch('/api/flows').then(r => r.json()).then(({ data }) => setFlows((data || []).filter((f: Flow) => f.status === 'active')));
  }, []);

  const handleEnroll = async () => {
    if (!enrollingProspect || !enrollFlowId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/flows/${enrollFlowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: enrollingProspect.id }),
      });
      const { success } = await res.json();
      if (success) {
        setEnrollSuccess(enrollingProspect.name || enrollingProspect.email);
        setTimeout(() => { setEnrollSuccess(null); setEnrollingProspect(null); }, 2000);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleConvert = async (prospect: Prospect) => {
    setConverting(prospect.id);
    const res = await fetch(`/api/prospects/${prospect.id}/convert`, { method: 'POST' });
    const json = await res.json();
    setConverting(null);
    if (json.success) {
      setConvertSuccess(prospect.name || prospect.email);
      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, status: 'converted' } : p));
      setTimeout(() => setConvertSuccess(null), 3000);
    }
  };

  const handleDecline = async (prospect: Prospect) => {
    setDeclining(prospect.id);
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'do_not_contact' }),
    });
    const json = await res.json();
    setDeclining(null);
    if (json.success) {
      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, status: 'do_not_contact' } : p));
    }
  };

  const handleBulkEnroll = async () => {
    if (!bulkFlowId) return;
    setBulkEnrolling(true);
    setBulkResult(null);
    let enrolled = 0, skipped = 0;
    const eligible = displayed.filter(p => p.status !== 'converted' && p.status !== 'do_not_contact');
    for (const p of eligible) {
      const res = await fetch(`/api/flows/${bulkFlowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const { success } = await res.json();
      if (success) enrolled++; else skipped++;
    }
    setBulkEnrolling(false);
    setBulkResult({ enrolled, skipped });
  };

  const displayed = prospects.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || [p.email, p.name, p.company, p.city, p.type, p.tags].some(v => v?.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="p-8 max-w-7xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Prospects</h1>
          <p className="text-content-slate mt-1 text-sm">Cold outreach contacts. Not opted in — keep it honest.</p>
        </div>
        <div className="flex gap-3">
          {flows.length > 0 && (
            <button onClick={() => { setShowBulkEnroll(true); setBulkFlowId(flows[0].id); setBulkResult(null); }} className="bg-surface-paper border border-surface-mist text-content-ink hover:bg-surface-cloud px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
              <Workflow size={16} className="mr-2 text-content-slate" /> Bulk Enroll
            </button>
          )}
          <button onClick={() => setShowImportModal(true)} className="bg-surface-paper border border-surface-mist text-content-ink hover:bg-surface-cloud px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
            <Upload size={16} className="mr-2 text-content-slate" /> Import CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-brand-storm hover:bg-brand-indigo text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
            <UserPlus size={16} className="mr-2" /> Add Prospect
          </button>
        </div>
      </header>

      {convertSuccess && (
        <div className="mb-4 flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium">
          <Check size={16} /> {convertSuccess} converted to a lead and added to Audience.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-content-slate" />
          </div>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-surface-mist rounded-lg focus:border-brand-storm sm:text-sm bg-surface-paper outline-none" placeholder="Search by email, name, company, city, type…" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-surface-mist rounded-lg px-3 py-2.5 text-sm bg-surface-paper outline-none focus:border-brand-storm text-content-ink">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-paper rounded-xl border border-surface-mist shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-cloud border-b border-surface-mist text-content-slate text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 font-medium">Email</th>
                <th className="px-4 py-4 font-medium">Company Name</th>
                <th className="px-4 py-4 font-medium">Source</th>
                <th className="px-4 py-4 font-medium">Type</th>
                <th className="px-4 py-4 font-medium">Tag</th>
                <th className="px-4 py-4 font-medium">Notes</th>
                <th className="px-4 py-4 font-medium">Phone</th>
                <th className="px-4 py-4 font-medium">City</th>
                <th className="px-4 py-4 font-medium">Reviews</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-mist text-sm">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><Loader2 className="animate-spin mx-auto text-content-slate" size={24} /></td></tr>
              ) : displayed.length > 0 ? displayed.map(prospect => (
                <tr key={prospect.id} className="hover:bg-surface-cloud transition-colors">
                  <td className="px-4 py-4 text-content-ink text-sm">{prospect.email}</td>
                  <td className="px-4 py-4 text-content-ink text-sm">{prospect.company || <span className="text-content-slate">—</span>}</td>
                  <td className="px-4 py-4 text-content-slate text-sm">{prospect.source || '—'}</td>
                  <td className="px-4 py-4 text-content-slate text-sm">{prospect.type || '—'}</td>
                  <td className="px-4 py-4">
                    {prospect.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {prospect.tags.split(',').map(t => (
                          <span key={t.trim()} className="px-1.5 py-0.5 rounded text-xs bg-surface-cloud border border-surface-mist text-content-slate">{t.trim()}</span>
                        ))}
                      </div>
                    ) : <span className="text-content-slate">—</span>}
                  </td>
                  <td className="px-4 py-4 text-content-slate text-sm max-w-40 truncate" title={prospect.notes || ''}>{prospect.notes || '—'}</td>
                  <td className="px-4 py-4 text-content-slate text-sm">{prospect.phone || '—'}</td>
                  <td className="px-4 py-4 text-content-slate text-sm">{prospect.city || '—'}</td>
                  <td className="px-4 py-4 text-content-slate text-sm">{prospect.reviews || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[prospect.status]}`}>
                      {STATUS_LABELS[prospect.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {prospect.status !== 'converted' && prospect.status !== 'do_not_contact' && (
                      <div className="flex items-center gap-3">
                        {flows.length > 0 && (
                          <button onClick={() => { setEnrollingProspect(prospect); setEnrollFlowId(flows[0].id); }} className="flex items-center gap-1 text-xs text-content-slate hover:text-brand-storm transition-colors" title="Enroll in flow">
                            <Workflow size={13} /> Enroll
                          </button>
                        )}
                        <button
                          onClick={() => handleConvert(prospect)}
                          disabled={converting === prospect.id}
                          className="flex items-center gap-1 text-xs text-content-slate hover:text-purple-600 transition-colors disabled:opacity-50"
                          title="Convert to lead"
                        >
                          {converting === prospect.id ? <Loader2 size={13} className="animate-spin" /> : <ArrowRightCircle size={13} />}
                          Convert
                        </button>
                        <button
                          onClick={() => handleDecline(prospect)}
                          disabled={declining === prospect.id}
                          className="flex items-center gap-1 text-xs text-content-slate hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Mark as declined / do not contact"
                        >
                          {declining === prospect.id ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                          Decline
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="w-12 h-12 bg-surface-cloud rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="text-content-slate" size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-content-ink">
                      {searchQuery || statusFilter !== 'all' ? 'No prospects match your filters' : 'No prospects yet'}
                    </h3>
                    <p className="text-sm text-content-slate mt-1">Import a CSV or add prospects manually to start cold outreach.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && prospects.length > 0 && (
        <p className="text-xs text-content-slate mt-3 text-right">
          Showing {displayed.length} of {prospects.length} prospects
        </p>
      )}

      {/* Modals */}
      {showAddModal && <AddProspectModal onClose={() => setShowAddModal(false)} onSaved={p => { setProspects(prev => [p, ...prev]); setShowAddModal(false); }} />}
      {showImportModal && <ImportCSVModal onClose={() => setShowImportModal(false)} onSaved={ps => { setProspects(prev => [...ps, ...prev]); setShowImportModal(false); }} />}

      {showBulkEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
              <h2 className="text-base font-semibold text-content-ink">Bulk Enroll in Flow</h2>
              <button onClick={() => setShowBulkEnroll(false)} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
            </div>
            <div className="p-6">
              {bulkResult ? (
                <div className="text-center py-4">
                  <Check size={32} className="mx-auto text-green-500 mb-3" />
                  <p className="text-content-ink font-medium">{bulkResult.enrolled} prospects enrolled</p>
                  {bulkResult.skipped > 0 && <p className="text-content-slate text-sm mt-1">{bulkResult.skipped} skipped (already enrolled or ineligible)</p>}
                  <button onClick={() => setShowBulkEnroll(false)} className="mt-5 px-5 py-2 bg-brand-storm text-white text-sm font-medium rounded-lg">Done</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-content-slate mb-4">
                    Enroll <strong>{displayed.filter(p => p.status !== 'converted' && p.status !== 'do_not_contact').length} prospects</strong> (currently visible) into:
                  </p>
                  <select value={bulkFlowId} onChange={e => setBulkFlowId(e.target.value)} className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm mb-4 bg-white">
                    {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    Already-enrolled prospects will be skipped automatically.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowBulkEnroll(false)} className="px-4 py-2 text-sm text-content-slate border border-surface-mist rounded-lg hover:bg-surface-cloud">Cancel</button>
                    <button onClick={handleBulkEnroll} disabled={bulkEnrolling || !bulkFlowId} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg flex items-center disabled:opacity-50">
                      {bulkEnrolling ? <Loader2 size={15} className="animate-spin mr-2" /> : <Workflow size={15} className="mr-2" />}
                      {bulkEnrolling ? 'Enrolling…' : 'Enroll All'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enroll in Flow Modal */}
      {enrollingProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
              <h2 className="text-base font-semibold text-content-ink">Enroll in Flow</h2>
              <button onClick={() => setEnrollingProspect(null)} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
            </div>
            <div className="p-6">
              {enrollSuccess ? (
                <div className="flex items-center gap-2 text-green-600 font-medium"><Check size={18} /> {enrollSuccess} enrolled successfully.</div>
              ) : (
                <>
                  <p className="text-sm text-content-slate mb-4">
                    Enroll <strong>{enrollingProspect.name || enrollingProspect.email}</strong> into a cold outreach flow.
                  </p>
                  <select value={enrollFlowId} onChange={e => setEnrollFlowId(e.target.value)} className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm mb-4 bg-white">
                    {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEnrollingProspect(null)} className="px-4 py-2 text-sm text-content-slate border border-surface-mist rounded-lg hover:bg-surface-cloud">Cancel</button>
                    <button onClick={handleEnroll} disabled={enrolling || !enrollFlowId} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg flex items-center disabled:opacity-50">
                      {enrolling ? <Loader2 size={15} className="animate-spin mr-2" /> : <Workflow size={15} className="mr-2" />}
                      {enrolling ? 'Enrolling…' : 'Enroll Prospect'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
