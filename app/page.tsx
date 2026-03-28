'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  PlayList,
  shufflePlaylistAction,
  listUserPlaylistsAction,
  unfollowPlaylistAction,
  copyPlaylistAction,
} from '@/app/actions/playlists';
import {
  getLikedTracksSummaryAction,
  clearLikedTracksAction,
  shuffleLikedTracksAction,
} from '@/app/actions/liked-tracks';
import PlaylistCard from '@/app/ui/playlists/playlist-card';
import LikedTracksCard from '@/app/ui/playlists/liked-tracks-card';

export default function Page() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<PlayList[]>([]);
  const [likedTracksTotal, setLikedTracksTotal] = useState<number | null>(null);
  const accessToken = session?.accessToken;
  const authError = session?.error;

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken || authError) {
      return;
    }

    const loadPlaylists = async () => {
      try {
        const [pls, likedTracks] = await Promise.all([
          listUserPlaylistsAction(),
          getLikedTracksSummaryAction(),
        ]);
        setPlaylists(pls);
        setLikedTracksTotal(likedTracks.total);
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

  const handleCopy = async (playlist: PlayList) => {
    try {
      if (!accessToken) {
        await signIn('spotify');
        return;
      }

      const copied = await copyPlaylistAction(playlist.id, playlist.name);
      setPlaylists((prev) => [...prev, copied]);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleClearLikedTracks = async () => {
    try {
      if (!accessToken) {
        await signIn('spotify');
        return;
      }

      await clearLikedTracksAction();
      setLikedTracksTotal(0);
    } catch (error) {
      console.error('Clear liked tracks failed:', error);
    }
  };

  const handleShuffleLikedTracks = async () => {
    try {
      if (!accessToken) {
        await signIn('spotify');
        return;
      }

      await shuffleLikedTracksAction();
    } catch (error) {
      console.error('Shuffle liked tracks failed:', error);
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
        {likedTracksTotal !== null && (
          <LikedTracksCard
            trackTotal={likedTracksTotal}
            onShuffleLikedTracks={handleShuffleLikedTracks}
            onClearLikedTracks={handleClearLikedTracks}
          />
        )}
        {playlists.map((pl) => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onShuffle={handleShuffle}
            onCopy={() => handleCopy(pl)}
            onUnfollow={() => handleUnfollow(pl)}
          />
        ))}
      </div>
    </main>
  );
}
