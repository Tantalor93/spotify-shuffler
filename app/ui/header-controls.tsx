'use client';

import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './theme-toggle';

export default function HeaderControls() {
  const { status } = useSession();

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {status === 'authenticated' && (
        <button
          onClick={() => void signOut({ callbackUrl: '/' })}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-surface-hover"
        >
          Logout
        </button>
      )}
    </div>
  );
}
