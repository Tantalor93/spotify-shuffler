'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
    trackTotal: number;
    onClearLikedTracks: () => void | Promise<void>;
};

export default function LikedTracksCard({ trackTotal, onClearLikedTracks }: Props) {
    const [clearing, setClearing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = async () => {
        setMenuOpen(false);

        const confirmed = window.confirm('Clear all liked tracks from Your Music?');
        if (!confirmed) return;

        setClearing(true);
        try {
            await onClearLikedTracks();
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="flex items-center justify-between rounded-xl border border-green-500/40 border-l-4 border-l-green-500 bg-card p-4 transition-colors hover:border-green-500">
            <div>
                <h3 className="flex items-center gap-2 font-bold text-foreground">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-500">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Liked Tracks
                </h3>
                <p className="text-sm text-muted">
                    {trackTotal} tracks
                    {clearing && <span className="ml-2 text-red-400">Clearing…</span>}
                </p>
            </div>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    disabled={clearing}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="More options"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                    </svg>
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-10 z-10 rounded-xl border border-border bg-card py-1 shadow-lg">
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-surface-hover"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                            </svg>
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
