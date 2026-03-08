'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Radio, Workflow, Users, UserSearch, Layers, BarChart3, Settings, Zap, BookOpen, LogOut, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-brand-glow text-brand-storm'
        : 'text-content-slate hover:bg-surface-cloud hover:text-content-ink'
    }`}>
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-surface-paper border-r border-surface-mist flex flex-col justify-between shrink-0">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-surface-mist">
          <Zap className="text-brand-storm w-6 h-6 mr-2 fill-brand-storm" />
          <span className="font-semibold text-lg tracking-tight">Signal</span>
        </div>
        <nav className="p-4 space-y-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem href="/broadcasts" icon={<Radio size={18} />} label="Broadcasts" />
          <NavItem href="/newsletter" icon={<Newspaper size={18} />} label="Newsletter" />
          <NavItem href="/flows" icon={<Workflow size={18} />} label="Flows" />
          <NavItem href="/audience" icon={<Users size={18} />} label="Audience" />
          <NavItem href="/prospects" icon={<UserSearch size={18} />} label="Prospects" />
          <NavItem href="/blueprints" icon={<Layers size={18} />} label="Blueprints" />
          <NavItem href="/readout" icon={<BarChart3 size={18} />} label="Readout" />
          <NavItem href="/playbook" icon={<BookOpen size={18} />} label="The Playbook" />
        </nav>
      </div>
      <div className="p-4 border-t border-surface-mist space-y-1">
        <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" />
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-content-slate hover:bg-surface-cloud hover:text-content-ink transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
