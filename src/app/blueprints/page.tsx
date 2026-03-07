"use client";

import { useState } from 'react';
import { Plus, Sun, Moon, FileText } from 'lucide-react';
import Link from 'next/link';

type Tab = 'all' | 'light' | 'shade';

export default function BlueprintsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const blueprints = [
    { id: 'story', name: "The Story Lead-In", type: "light", desc: "A soft, value-first story that naturally transitions into a soft CTA." },
    { id: 'objection', name: "The Objection Crusher", type: "light", desc: "Tackles a common industry myth while providing actionable advice." },
    { id: 'deadline', name: "The Hard Deadline", type: "shade", desc: "High urgency, scarcity-driven offer with a bold CTA button." },
    { id: 'godfather', name: "The Godfather Offer", type: "shade", desc: "An irresistible, risk-free offer designed for immediate conversion." },
  ];

  const filtered = activeTab === 'all' ? blueprints : blueprints.filter(bp => bp.type === activeTab);

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-content-ink">Blueprints</h1>
          <p className="text-content-slate mt-1 text-sm">Design once, send often. Start from a proven framework.</p>
        </div>
        <Link href="/blueprints/new?framework=story" className="bg-brand-storm hover:bg-brand-indigo text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm">
          <Plus size={18} className="mr-2" />
          New Blueprint
        </Link>
      </header>

      {/* Light vs Shade Tabs */}
      <div className="bg-surface-paper border border-surface-mist rounded-lg p-1 inline-flex mb-8 shadow-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-surface-cloud text-content-ink' : 'text-content-slate hover:text-content-ink'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('light')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'light' ? 'bg-brand-glow text-brand-storm' : 'text-content-slate hover:text-content-ink'
          }`}
        >
          <Sun size={16} className="mr-2" />
          Light (Value)
        </button>
        <button
          onClick={() => setActiveTab('shade')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'shade' ? 'bg-indigo-50 text-indigo-700' : 'text-content-slate hover:text-content-ink'
          }`}
        >
          <Moon size={16} className="mr-2" />
          Shade (Offer)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Start from scratch — always visible */}
        <Link href="/blueprints/new?framework=story" className="border-2 border-dashed border-surface-mist hover:border-brand-storm rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-surface-cloud hover:bg-brand-glow/30 min-h-[240px]">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Plus className="text-brand-storm" size={24} />
          </div>
          <h3 className="text-sm font-semibold text-content-ink">Start from scratch</h3>
          <p className="text-xs text-content-slate mt-1">Open the visual builder.</p>
        </Link>

        {filtered.map((bp) => (
          <Link href={`/blueprints/new?framework=${bp.id}`} key={bp.id} className="bg-surface-paper border border-surface-mist rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group cursor-pointer">
            <div className="h-32 bg-surface-cloud border-b border-surface-mist flex items-center justify-center relative overflow-hidden">
              <FileText className="text-content-slate opacity-20" size={48} />
              <div className="absolute top-3 right-3">
                {bp.type === 'light' ? (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide flex items-center">
                    <Sun size={12} className="mr-1"/> Light
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide flex items-center">
                    <Moon size={12} className="mr-1"/> Shade
                  </span>
                )}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-base font-semibold text-content-ink group-hover:text-brand-storm transition-colors">{bp.name}</h3>
              <p className="text-sm text-content-slate mt-1.5 flex-1">{bp.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
