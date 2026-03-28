'use client';

import { PlayList } from "@/app/actions/playlists";
import { useEffect, useRef, useState } from "react";

type Props = {
    playlist: PlayList;
    onShuffle: (id: string) => void | Promise<void>;
    onUnfollow?: () => void | Promise<void>;
    onCopy?: () => void | Promise<void>;
};

export default function PlaylistCard({ playlist, onShuffle, onUnfollow, onCopy }: Props) {
    const [shuffling, setShuffling] = useState(false);
    const [unfollowing, setUnfollowing] = useState(false);
    const [copying, setCopying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const tracksTotal = playlist.items.total;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = async () => {
        setShuffling(true);
        try {
            await onShuffle(playlist.id);
        } finally {
            setShuffling(false);
        }
    };

    const handleUnfollow = async () => {
        if (!onUnfollow) return;
        setMenuOpen(false);

        const confirmed = window.confirm(`Unfollow playlist "${playlist.name}"?`);
        if (!confirmed) return;

        setUnfollowing(true);
        try {
            await onUnfollow();
        } finally {
            setUnfollowing(false);
        }
    };

    const handleCopy = async () => {
        if (!onCopy) return;
        setMenuOpen(false);
        setCopying(true);
        try {
            await onCopy();
        } finally {
            setCopying(false);
        }
    };

    const busy = shuffling || unfollowing || copying;

    return (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-green-500">
            <div>
                <h3 className="font-bold text-foreground">{playlist.name}</h3>
                <p className="text-sm text-muted">
                    {tracksTotal} tracks
                    {copying && <span className="ml-2 text-violet-500">Copying…</span>}
                    {unfollowing && <span className="ml-2 text-red-400">Unfollowing…</span>}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleAction}
                    disabled={busy}
                    className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {shuffling ? 'Shuffling…' : 'Shuffle'}
                </button>

                {/* ⋯ dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        disabled={busy}
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
                        <div className="absolute right-0 top-10 z-10 min-w-36 rounded-xl border border-border bg-card py-1 shadow-lg">
                            <button
                                onClick={handleCopy}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-violet-500 hover:bg-surface-hover"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copy playlist
                            </button>
                            <button
                                onClick={handleUnfollow}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-surface-hover"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4h6v2" />
                                </svg>
                                Unfollow
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
