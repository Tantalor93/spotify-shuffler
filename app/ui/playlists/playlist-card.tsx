'use client';

import { SimplifiedPlaylist } from "@spotify/web-api-ts-sdk";
import { useState } from "react";

interface Props {
  playlist: SimplifiedPlaylist;
  onShuffle: (id: string) => Promise<void>;
}

export default function PlaylistCard({ playlist, onShuffle }: Props) {
  const [shuffling, setShuffling] = useState(false);


  // For some reason SDK expects `track` field, but in reality it is returned as `items`
  // https://developer.spotify.com/documentation/web-api/reference/get-playlists-items
  const tracksTotal = playlist.tracks?.total ?? playlist.items?.total ?? 0;


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
