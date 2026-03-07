'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSpotifySDK, shuffleArray, fetchAllPlaylistTrackUris, updatePlayList } from '@/app/lib/spotify';
import { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import PlaylistCard from '@/app/ui/playlists/playlist-card';

export default function Page() {
  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const sdk = useMemo(() => getSpotifySDK(), []);

  useEffect(() => {
    if (!sdk) return;
    
    sdk.currentUser.playlists.playlists().then((data) => {
      setPlaylists(data.items);
    });
    
  }, [sdk]);

  const handleLogout = () => {
    if (typeof window === 'undefined') return;

    for (const storage of [window.localStorage, window.sessionStorage]) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        if (key.toLowerCase().includes('spotify')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    }

    window.location.reload();
  };

  const handleShuffle = async (id: string) => {
    if (!sdk) return;

    try {
      const token = await sdk.getAccessToken()

      const trackUris = await fetchAllPlaylistTrackUris(id, token?.access_token ?? '');

      const shuffledUris = shuffleArray(trackUris);

      await updatePlayList(id, shuffledUris, token?.access_token ?? '');

    } catch (error) {
      console.error("Shuffle failed:", error);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <button
          onClick={handleLogout}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      <div className="space-y-4">
        {playlists.map((pl) => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onShuffle={handleShuffle}
          />
        ))}
      </div>
    </main>
  );
}
