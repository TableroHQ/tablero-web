'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronUp } from 'lucide-react';
import { useStore, ROLE_LABELS, ROLE_ROUTES } from '@/lib/store';

export default function RoleSwitcher() {
  const [, s] = useStore();
  const { user } = s.get();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Dev-only preview tool — never visible in production builds
  if (process.env.NODE_ENV !== 'development') return null;

  const change = (r) => {
    s.setRole(r);
    setOpen(false);
    router.push(ROLE_ROUTES[r]);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[70]" data-testid="role-switcher">
      {open && (
        <div className="mb-2 bg-white rounded-2xl shadow-2xl border border-border p-2 min-w-[200px]">
          <div className="label-eyebrow px-3 py-2">Preview as</div>
          {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'GUEST').map(([k, label]) => (
            <button key={k} onClick={() => change(k)} data-testid={`role-${k.toLowerCase()}`}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-fn hover:bg-cream-sub ${user.role === k ? 'text-primary font-semibold' : ''}`}>
              {label} <span className="text-[10px] font-mono text-ink-muted ml-2">{ROLE_ROUTES[k]}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} data-testid="role-switcher-trigger"
        className="bg-ink text-cream px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-fn text-sm font-medium hover:bg-ink-body transition">
        <Users size={14} /> {ROLE_LABELS[user.role]} <ChevronUp size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
