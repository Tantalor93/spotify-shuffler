'use client';

import { PlayList } from "@/app/actions/spotify";
import { useState } from "react";

type Props = {
    playlist: PlayList;
    onShuffle: (id: string) => void | Promise<void>;
    onUnfollow?: () => void | Promise<void>;
};

export default function PlaylistCard({ playlist, onShuffle, onUnfollow }: Props) {
    const [shuffling, setShuffling] = useState(false);
    const [unfollowing, setUnfollowing] = useState(false);

    const tracksTotal = playlist.items.total;

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

        const confirmed = window.confirm(`Unfollow playlist "${playlist.name}"?`);
        if (!confirmed) return;

        setUnfollowing(true);
        try {
            await onUnfollow();
        } finally {
            setUnfollowing(false);
        }
    };

    return (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-green-500">
            <div>
                <h3 className="font-bold text-foreground">{playlist.name}</h3>
                <p className="text-sm text-muted">{tracksTotal} tracks</p>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={handleAction}
                    disabled={shuffling || unfollowing}
                    className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {shuffling ? 'Shuffling…' : 'Shuffle'}
                </button>

                <button
                    onClick={handleUnfollow}
                    disabled={unfollowing || shuffling}
                    className="rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                >
                    {unfollowing ? 'Unfollowing…' : 'Unfollow'}
                </button>
            </div>
        </div>
    );
}
