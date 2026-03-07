"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Upload, UserPlus, Filter, X, Loader2, Check, Tag, Workflow } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  source?: string;
  referral_source?: string;
  tags?: string;
  created_at: string;
};

type Flow = { id: string; name: string; status: string };

// ─── Add Contact Modal ──────────────────────────────────────────────────────

function AddContactModal({ onClose, onSaved }: { onClose: () => void; onSaved: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', role: '', source: 'Manual', tags: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setIsSubmitting(true);
    setError('');

    // Auto-apply new-lead tag for non-manual sources
    const baseTags = form.tags.trim() ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const autoTags = ['Website', 'Referral', 'Social'].includes(form.source) && !baseTags.includes('new-lead')
      ? [...baseTags, 'new-lead']
      : baseTags;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      role: form.role.trim() || null,
      source: form.source,
      tags: autoTags.length ? autoTags.join(', ') : null,
    };

    // Check if this email is already a prospect — if so, convert them instead
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id, status')
      .eq('email', payload.email)
      .maybeSingle();

    if (existingProspect && existingProspect.status !== 'converted') {
      const convRes = await fetch(`/api/prospects/${existingProspect.id}/convert`, { method: 'POST' });
      const convJson = await convRes.json();
      setIsSubmitting(false);
      if (convJson.success) { onSaved(convJson.lead as Lead); return; }
      setError(convJson.error || 'Failed to convert prospect to lead.');
      return;
    }

    const { data, error: supaErr } = await supabase.from('leads').insert([payload]).select().single();
    setIsSubmitting(false);

    if (supaErr) { setError(supaErr.message); return; }
    onSaved(data as Lead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
          <h2 className="text-base font-semibold text-content-ink">Add Contact</h2>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm bg-white">
                <option>Manual</option>
                <option>Website</option>
                <option>Referral</option>
                <option>Social</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
            <div>
              <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Role</label>
              <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Marketing Manager" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-content-slate uppercase tracking-wider mb-1 block">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Hot Lead, Website Lead, Q1" className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-content-slate hover:text-content-ink border border-surface-mist rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50">
              {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : <UserPlus size={15} className="mr-2" />}
              {isSubmitting ? 'Saving...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Import CSV Modal ───────────────────────────────────────────────────────

type CsvRow = Record<string, string>;

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  }).filter(row => row['name'] || row['email']);
}

function ImportCSVModal({ onClose, onSaved }: { onClose: () => void; onSaved: (leads: Lead[]) => void }) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string);
      if (!parsed.length) { setError('No valid rows found. Make sure your CSV has a header row with at least a "name" or "email" column.'); }
      else { setError(''); setRows(parsed); }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setIsSubmitting(true);
    setError('');

    const rows_with_email = rows.filter(r => r['email'] || r['email address']);

    // For any row whose email is already a prospect, convert them first
    const convertedLeads: Lead[] = [];
    const toInsert = [];

    for (const r of rows_with_email) {
      const email = (r['email'] || r['email address']).trim().toLowerCase();
      const { data: existingProspect } = await supabase
        .from('prospects')
        .select('id, status')
        .eq('email', email)
        .maybeSingle();

      if (existingProspect && existingProspect.status !== 'converted') {
        const convRes = await fetch(`/api/prospects/${existingProspect.id}/convert`, { method: 'POST' });
        const convJson = await convRes.json();
        if (convJson.success) { convertedLeads.push(convJson.lead as Lead); continue; }
      }

      toInsert.push({
        name: r['name'] || r['full name'] || 'Unknown',
        email,
        phone: r['phone'] || r['phone number'] || null,
        company: r['company'] || null,
        role: r['role'] || r['job title'] || null,
        source: r['source'] || 'CSV Import',
        tags: r['tags'] || null,
      });
    }

    if (toInsert.length > 0) {
      const { data, error: supaErr } = await supabase.from('leads').insert(toInsert).select();
      setIsSubmitting(false);
      if (supaErr) { setError(supaErr.message); return; }
      onSaved([...convertedLeads, ...((data as Lead[]) || [])]);
    } else {
      setIsSubmitting(false);
      onSaved(convertedLeads);
    }
  };

  const previewHeaders = rows.length ? Object.keys(rows[0]).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
          <h2 className="text-base font-semibold text-content-ink">Import CSV</h2>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6">
          {!rows.length ? (
            <div
              className="border-2 border-dashed border-surface-mist rounded-xl p-12 text-center cursor-pointer hover:border-brand-storm hover:bg-brand-glow/20 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mx-auto text-content-slate mb-3" size={28} />
              <p className="text-sm font-medium text-content-ink">Click to upload a CSV file</p>
              <p className="text-xs text-content-slate mt-1">Expects columns: name, email, phone, company, role, source, tags</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-content-ink font-medium">{fileName} — <span className="text-content-slate font-normal">{rows.length} contacts ready to import</span></p>
                <button onClick={() => { setRows([]); setFileName(''); }} className="text-xs text-content-slate hover:text-content-ink underline">Change file</button>
              </div>
              <div className="border border-surface-mist rounded-lg overflow-hidden mb-1">
                <table className="w-full text-xs">
                  <thead className="bg-surface-cloud text-content-slate uppercase tracking-wider">
                    <tr>
                      {previewHeaders.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-mist">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {previewHeaders.map(h => <td key={h} className="px-3 py-2 text-content-ink truncate max-w-[140px]">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && <p className="text-xs text-content-slate mb-4">…and {rows.length - 5} more rows</p>}
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-content-slate hover:text-content-ink border border-surface-mist rounded-lg transition-colors">Cancel</button>
            <button onClick={handleImport} disabled={!rows.length || isSubmitting} className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50">
              {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
              {isSubmitting ? 'Importing...' : `Import ${rows.length || ''} Contacts`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Segments Panel ─────────────────────────────────────────────────────────

function SegmentsPanel({ allLeads, selectedTags, onChange, onClose }: {
  allLeads: Lead[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  onClose: () => void;
}) {
  const allTags = Array.from(
    new Set(allLeads.flatMap(l => l.tags ? l.tags.split(',').map(t => t.trim()).filter(Boolean) : []))
  ).sort();

  const toggle = (tag: string) => {
    onChange(selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag]);
  };

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-80 bg-white border-l border-surface-mist shadow-xl h-full flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-mist">
          <div className="flex items-center text-content-ink font-semibold text-sm">
            <Tag size={16} className="mr-2 text-brand-storm" /> Filter by Segment
          </div>
          <button onClick={onClose} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {allTags.length === 0 ? (
            <p className="text-sm text-content-slate">No tags found. Add tags to your contacts to create segments.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-brand-storm text-white border-brand-storm'
                      : 'bg-surface-cloud text-content-slate border-surface-mist hover:border-brand-storm hover:text-brand-storm'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="px-5 py-4 border-t border-surface-mist">
            <button onClick={() => onChange([])} className="text-sm text-brand-storm hover:text-brand-indigo font-medium">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AudiencePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSegments, setShowSegments] = useState(false);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [enrollingLead, setEnrollingLead] = useState<Lead | null>(null);
  const [enrollFlowId, setEnrollFlowId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error) setLeads((data as Lead[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    fetch('/api/flows').then(r => r.json()).then(({ data }) => setFlows((data || []).filter((f: Flow) => f.status === 'active')));
  }, []);

  const handleEnroll = async () => {
    if (!enrollingLead || !enrollFlowId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/flows/${enrollFlowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: enrollingLead.id }),
      });
      const { success } = await res.json();
      if (success) {
        setEnrollSuccess(enrollingLead.name);
        setTimeout(() => { setEnrollSuccess(null); setEnrollingLead(null); }, 2000);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const displayedLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || [lead.name, lead.email, lead.tags].some(v => v?.toLowerCase().includes(q));
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag =>
      lead.tags?.split(',').map(t => t.trim()).includes(tag)
    );
    return matchesSearch && matchesTags;
  });

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Audience</h1>
          <p className="text-content-slate mt-1 text-sm">Manage your contacts, segments, and consent status.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-surface-paper border border-surface-mist text-content-ink hover:bg-surface-cloud px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
          >
            <Upload size={16} className="mr-2 text-content-slate" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-storm hover:bg-brand-indigo text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
          >
            <UserPlus size={16} className="mr-2" />
            Add Contact
          </button>
        </div>
      </header>

      {/* Filters & Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-content-slate" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-surface-mist rounded-lg focus:ring-brand-storm focus:border-brand-storm sm:text-sm bg-surface-paper outline-none"
            placeholder="Search by name, email, or tags..."
          />
        </div>
        <button
          onClick={() => setShowSegments(true)}
          className={`border px-4 py-2.5 rounded-lg font-medium text-sm flex items-center shadow-sm transition-colors ${
            selectedTags.length > 0
              ? 'bg-brand-storm text-white border-brand-storm'
              : 'bg-surface-paper border-surface-mist text-content-ink hover:bg-surface-cloud'
          }`}
        >
          <Filter size={16} className="mr-2" />
          Segments {selectedTags.length > 0 && `(${selectedTags.length})`}
        </button>
      </div>

      {/* Active segment pills */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-glow text-brand-storm border border-brand-storm/20">
              {tag}
              <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="ml-1.5 hover:text-brand-indigo">
                <X size={12} />
              </button>
            </span>
          ))}
          <button onClick={() => setSelectedTags([])} className="text-xs text-content-slate hover:text-content-ink underline self-center">Clear all</button>
        </div>
      )}

      {/* Audience Table */}
      <div className="bg-surface-paper rounded-xl border border-surface-mist shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-cloud border-b border-surface-mist text-content-slate text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Company / Role</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Tags</th>
                <th className="px-6 py-4 font-medium">Added</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-mist text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-content-slate" size={24} />
                  </td>
                </tr>
              ) : displayedLeads.length > 0 ? (
                displayedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-cloud transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-content-ink">{lead.name}</div>
                      <div className="text-content-slate mt-0.5">{lead.email}</div>
                      {lead.phone && <div className="text-content-slate mt-0.5 text-xs">{lead.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {lead.company || lead.role ? (
                        <>
                          {lead.company && <div className="text-content-ink">{lead.company}</div>}
                          {lead.role && <div className="text-content-slate text-xs mt-0.5">{lead.role}</div>}
                        </>
                      ) : <span className="text-content-slate">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {(lead.source || lead.referral_source) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-cloud border border-surface-mist text-content-slate">
                          {lead.referral_source || lead.source}
                        </span>
                      ) : <span className="text-content-slate">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {lead.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.split(',').map((tag: string) => (
                            <span key={tag.trim()} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-cloud border border-surface-mist text-content-slate">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-content-slate">—</span>}
                    </td>
                    <td className="px-6 py-4 text-content-slate">
                      {new Date(lead.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {flows.length > 0 && (
                        <button
                          onClick={() => { setEnrollingLead(lead); setEnrollFlowId(flows[0].id); }}
                          className="flex items-center gap-1 text-xs text-content-slate hover:text-brand-storm transition-colors"
                          title="Enroll in flow"
                        >
                          <Workflow size={13} /> Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-surface-cloud rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="text-content-slate" size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-content-ink">
                      {searchQuery || selectedTags.length ? 'No contacts match your filters' : 'No contacts yet'}
                    </h3>
                    <p className="text-sm text-content-slate mt-1">
                      {searchQuery || selectedTags.length ? 'Try adjusting your search or segment filters.' : 'Upload a CSV or add a contact to start building your audience.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count footer */}
      {!isLoading && leads.length > 0 && (
        <p className="text-xs text-content-slate mt-3 text-right">
          Showing {displayedLeads.length} of {leads.length} contacts
        </p>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onSaved={(lead) => { setLeads(prev => [lead, ...prev]); setShowAddModal(false); }}
        />
      )}
      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onSaved={(newLeads) => { setLeads(prev => [...newLeads, ...prev]); setShowImportModal(false); }}
        />
      )}
      {showSegments && (
        <SegmentsPanel
          allLeads={leads}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          onClose={() => setShowSegments(false)}
        />
      )}

      {/* Enroll in Flow Modal */}
      {enrollingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-mist">
              <h2 className="text-base font-semibold text-content-ink">Enroll in Flow</h2>
              <button onClick={() => setEnrollingLead(null)} className="text-content-slate hover:text-content-ink"><X size={18} /></button>
            </div>
            <div className="p-6">
              {enrollSuccess ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <Check size={18} /> {enrollSuccess} enrolled successfully.
                </div>
              ) : (
                <>
                  <p className="text-sm text-content-slate mb-4">
                    Enroll <strong>{enrollingLead.name}</strong> into an active flow sequence.
                  </p>
                  <select
                    value={enrollFlowId}
                    onChange={e => setEnrollFlowId(e.target.value)}
                    className="w-full border border-surface-mist rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-storm mb-4 bg-white"
                  >
                    {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEnrollingLead(null)} className="px-4 py-2 text-sm text-content-slate border border-surface-mist rounded-lg hover:bg-surface-cloud transition-colors">Cancel</button>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling || !enrollFlowId}
                      className="px-5 py-2 bg-brand-storm hover:bg-brand-indigo text-white text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                      {enrolling ? <Loader2 size={15} className="animate-spin mr-2" /> : <Workflow size={15} className="mr-2" />}
                      {enrolling ? 'Enrolling...' : 'Enroll Contact'}
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
