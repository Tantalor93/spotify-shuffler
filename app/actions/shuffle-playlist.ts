'use server';

import { revalidatePath } from 'next/cache';
import { shuffleArray } from '@/app/lib/spotify';

type PlaylistItemsPage = {
  items: Array<{ item?: { uri?: string | null }; track?: { uri?: string | null } }>;
  total: number;
};

async function fetchAllPlaylistTrackUris(playlistId: string, accessToken: string): Promise<string[]> {
  const limit = 100;
  let offset = 0;
  let total = Infinity;
  const allItems: PlaylistItemsPage['items'] = [];

  while (offset < total) {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`Spotify ${res.status}: ${await res.text()}`);
    }

    const page: PlaylistItemsPage = await res.json();
    allItems.push(...page.items);
    total = page.total;
    offset += page.items.length;

    if (page.items.length === 0) break;
  }

  return allItems
    .map((i) => i.item?.uri ?? i.track?.uri ?? null)
    .filter((uri): uri is string => Boolean(uri));
}

async function replacePlaylistTracks(playlistId: string, trackUris: string[], accessToken: string) {
  const clearRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [] }),
    cache: 'no-store',
  });

  if (!clearRes.ok) {
    throw new Error(`Spotify ${clearRes.status}: ${await clearRes.text()}`);
  }

  for (let offset = 0; offset < trackUris.length; offset += 100) {
    const chunk = trackUris.slice(offset, offset + 100);

    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: chunk, position: offset }),
      cache: 'no-store',
    });

    if (!addRes.ok) {
      throw new Error(`Spotify ${addRes.status}: ${await addRes.text()}`);
    }
  }
}

export async function shufflePlaylistAction(playlistId: string, accessToken: string) {
  const uris = await fetchAllPlaylistTrackUris(playlistId, accessToken);
  const shuffled = shuffleArray(uris);
  await replacePlaylistTracks(playlistId, shuffled, accessToken);
  revalidatePath('/');
}

