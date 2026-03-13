'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  PlayList,
  shufflePlaylistAction,
  listUserPlaylistsAction,
  unfollowPlaylistAction,
} from '@/app/actions/spotify';
import PlaylistCard from '@/app/ui/playlists/playlist-card';

export default function Page() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<PlayList[]>([]);
  const accessToken = session?.accessToken;
  const authError = session?.error;

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken || authError) {
      return;
    }

    const loadPlaylists = async () => {
      try {
        const pls = await listUserPlaylistsAction();
        setPlaylists(pls);
      } catch (error) {
        console.error('Loading playlists failed:', error);
      }
    };

    loadPlaylists();
  }, [status, accessToken, authError]);

  const handleShuffle = async (id: string) => {
    try {
      if (!accessToken) {
        await signIn('spotify');
        return;
      }

      await shufflePlaylistAction(id);
    } catch (error) {
      console.error('Shuffle failed:', error);
    }
  };

  const handleUnfollow = async (playlist: PlayList) => {
    try {
      if (!accessToken) {
        await signIn('spotify');
        return;
      }

      await unfollowPlaylistAction(playlist.uri);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
    } catch (error) {
      console.error('Unfollow failed:', error);
    }
  };

  if (status === 'loading') {
    return (
      <main className="max-w-2xl mx-auto px-6 pb-6">
        <p>Loading session…</p>
      </main>
    );
  }

  if (status !== 'authenticated') {
    return (
      <main className="max-w-2xl mx-auto px-6 pb-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted">Sign in to load your Spotify playlists.</p>
          <button
            onClick={() => void signIn('spotify')}
            className="mt-4 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
          >
            Sign in with Spotify
          </button>
        </div>
      </main>
    );
  }

  if (authError === 'RefreshAccessTokenError') {
    return (
      <main className="max-w-2xl mx-auto px-6 pb-6">
        <p className="text-sm text-muted">Spotify session expired. Please reconnect.</p>
        <button
          onClick={() => void signIn('spotify')}
          className="mt-4 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
        >
          Reconnect Spotify
        </button>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="max-w-2xl mx-auto px-6 pb-6">
        <p className="text-sm text-muted">Missing Spotify access token in session.</p>
        <button
          onClick={() => void signIn('spotify')}
          className="mt-4 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
        >
          Reconnect Spotify
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pb-6">
      <div className="space-y-4">
        {playlists.map((pl) => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onShuffle={handleShuffle}
            onUnfollow={() => handleUnfollow(pl)}
          />
        ))}
      </div>
    </main>
  );
}
