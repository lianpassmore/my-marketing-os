"use client";

import { useState } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AddContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const[source, setSource] = useState('Manual Entry');
  const [tags, setTags] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Convert comma-separated tags into a clean array: "lead, VIP" ->["lead", "VIP"]
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const { error } = await supabase.from('leads').insert([
        {
          name,
          email,
          source,
          tags: tagsArray,
          consent_status: 'subscribed',
        }
      ]);

      if (error) throw error;

      // Close modal, reset form, and refresh the page to show the new lead
      setIsOpen(false);
      setName('');
      setEmail('');
      setTags('');
      router.refresh(); 
    } catch (error: any) {
      console.error('Error adding contact:', error);
      alert(error.message || 'Failed to add contact.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-brand-storm hover:bg-brand-indigo text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center shadow-sm"
      >
        <UserPlus size={16} className="mr-2" />
        Add Contact
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-content-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-paper rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-surface-mist">
            <div className="flex justify-between items-center p-5 border-b border-surface-mist bg-surface-cloud">
              <h2 className="text-lg font-semibold text-content-ink">Add New Contact</h2>
              <button onClick={() => setIsOpen(false)} className="text-content-slate hover:text-content-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-content-slate mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-surface-mist rounded-md px-3 py-2 text-sm focus:border-brand-storm outline-none" 
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-content-slate mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-surface-mist rounded-md px-3 py-2 text-sm focus:border-brand-storm outline-none" 
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content-slate mb-1">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full border border-surface-mist rounded-md px-3 py-2 text-sm focus:border-brand-storm outline-none" 
                  placeholder="e.g. website-lead, VIP, spring-promo"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-content-slate hover:text-content-ink transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand-storm hover:bg-brand-indigo text-white px-5 py-2 rounded-md font-medium text-sm transition-colors flex items-center disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}