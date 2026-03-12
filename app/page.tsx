'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  PlayList,
  shufflePlaylistAction,
  listUserPlaylistsAction,
  unfollowPlaylistAction,
} from '@/app/actions/spotify';
import PlaylistCard from '@/app/ui/playlists/playlist-card';
import ThemeToggle from '@/app/ui/theme-toggle';

export default function Page() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<PlayList[]>([]);
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
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
  }, [status, accessToken]);

  const handleLogout = () => {
    void signOut({ callbackUrl: '/' });
  };

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
      <main className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
        <p>Loading session…</p>
      </main>
    );
  }

  if (status !== 'authenticated') {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-bold">My Playlists</h1>
          <p className="mt-3 text-sm text-muted">Sign in to load your Spotify playlists.</p>
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

  if (!accessToken) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
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
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-surface-hover"
          >
            Logout
          </button>
        </div>
      </div>

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
