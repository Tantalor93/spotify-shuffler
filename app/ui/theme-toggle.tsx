'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isHydrated) {
    return (
      <button
        type="button"
        disabled
        aria-label="Theme toggle"
        className="rounded-md border border-border bg-card p-2 opacity-60"
      >
        <span className="block size-5" aria-hidden="true" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="rounded-md border border-border bg-card p-2 hover:bg-surface-hover"
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
