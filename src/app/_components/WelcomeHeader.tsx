'use client';

import { useEffect, useState } from 'react';

export function WelcomeHeader() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem('signal_name'));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-content-ink">
        Welcome back{name ? `, ${name}` : ''}
      </h1>
      <p className="text-content-slate mt-1 text-sm">Here is what is happening across your audience today.</p>
    </div>
  );
}
