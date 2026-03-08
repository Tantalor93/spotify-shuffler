'use client';

import { PlayList } from "@/app/actions/spotify";
import { useState } from "react";

interface Props {
  playlist: PlayList;
  onShuffle: (id: string) => Promise<void>;
}

export default function PlaylistCard({ playlist, onShuffle }: Props) {
  const [shuffling, setShuffling] = useState(false);

  const tracksTotal = playlist.items.total;

  const handleAction = async () => {
    setShuffling(true);
    await onShuffle(playlist.id);
    setShuffling(false);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-green-500 transition-colors">
      <div>
        <h3 className="font-bold text-white">{playlist.name}</h3>
        <p className="text-sm text-gray-400">{tracksTotal} tracks</p>
      </div>
      <button
        onClick={handleAction}
        disabled={shuffling}
        className="px-4 py-2 bg-green-500 text-black font-bold rounded-full hover:scale-105 transition disabled:opacity-50"
      >
        {shuffling ? 'Shuffling...' : 'Shuffle'}
      </button>
    </div>
  );
}
