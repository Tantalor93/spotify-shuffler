'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSpotifySDK, userPlaylists, PlayList } from '@/app/lib/spotify';
import { shufflePlaylistAction } from '@/app/actions/shuffle-playlist';
import PlaylistCard from '@/app/ui/playlists/playlist-card';

export default function Page() {
  const [playlists, setPlaylists] = useState<PlayList[]>([]);
  const sdk = useMemo(() => getSpotifySDK(), []);

  const getAccessTokenOrAuthenticate = async (): Promise<string | null> => {
    if (!sdk) return null;

    let token = await sdk.getAccessToken();
    if (!token?.access_token) {
      const resp = await sdk.authenticate();
      token = resp.accessToken;
    }

    return token?.access_token ?? null;
  };

  useEffect(() => {
    if (!sdk) return;

    const loadPlaylists = async () => {
      const accessToken = await getAccessTokenOrAuthenticate();
      if (!accessToken) return;

      const pls = await userPlaylists(accessToken);
      setPlaylists(pls);
    };

    loadPlaylists();
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
    try {
      const accessToken = await getAccessTokenOrAuthenticate();
      if (!accessToken) return;

      console.log('access token obtained, shuffling playlist', accessToken);

      await shufflePlaylistAction(id, accessToken);
    } catch (error) {
      console.error('Shuffle failed:', error);
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
