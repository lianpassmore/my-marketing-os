'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-surface-cloud flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Zap className="text-brand-storm w-7 h-7 mr-2 fill-brand-storm" />
          <span className="font-semibold text-2xl tracking-tight">Signal</span>
        </div>
        <div className="bg-surface-paper border border-surface-mist rounded-xl p-8">
          <h1 className="text-lg font-semibold text-content-ink mb-6">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-slate mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 text-sm bg-surface-cloud border border-surface-mist rounded-lg text-content-ink placeholder:text-content-slate focus:outline-none focus:ring-2 focus:ring-brand-storm/30 focus:border-brand-storm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-slate mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 text-sm bg-surface-cloud border border-surface-mist rounded-lg text-content-ink placeholder:text-content-slate focus:outline-none focus:ring-2 focus:ring-brand-storm/30 focus:border-brand-storm"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-brand-storm text-white text-sm font-medium rounded-lg hover:bg-brand-storm/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
