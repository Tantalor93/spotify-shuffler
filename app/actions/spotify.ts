'use server';

import { revalidatePath } from 'next/cache';
import { shuffleArray } from '@/app/lib/spotify';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PlaylistItem = {
    item: { uri: string }
}

type PlaylistItemsPage = {
    items: Array<PlaylistItem>;
    total: number;
};

export type PlayList = {
    id: string;
    name: string;
    uri: string;
    collaborative: boolean;
    owner: { id: string };
    items: { total: number };
}

export type LikedTracksSummary = {
    total: number;
};

type PlayListPage = {
    total: number;
    items: Array<PlayList>;
}

type LikedTracksPage = {
    total: number;
    items: Array<{
        track: {
            uri: string;
        };
    }>;
};

async function requireSpotifySession(): Promise<{ accessToken: string; spotifyUserId?: string }> {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;

    if (!accessToken) {
        throw new Error('Not authenticated with Spotify.');
    }

    return {
        accessToken,
        spotifyUserId: session.spotifyUserId,
    };
}

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
        .map((i) => i.item.uri)
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

export async function shufflePlaylistAction(playlistId: string) {
    console.log(`Shuffling playlist ${playlistId}`);

    const { accessToken } = await requireSpotifySession();

    const uris = await fetchAllPlaylistTrackUris(playlistId, accessToken);

    const shuffled = shuffleArray(uris);
    await replacePlaylistTracks(playlistId, shuffled, accessToken);
    revalidatePath('/');
    
    console.log(`Finished shuffling playlist ${playlistId}`);
}

export async function listUserPlaylistsAction(): Promise<PlayList[]> {
    const { accessToken, spotifyUserId } = await requireSpotifySession();

    if (!spotifyUserId) {
        throw new Error('Missing Spotify user id in session. Sign in again.');
    }

    const limit = 20;
    let offset = 0;
    let total = Infinity;
    const allItems: Array<PlayList> = [];

    while (offset < total) {
        const res = await fetch(
            `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Spotify ${res.status}: ${body}`);
        }

        const page: PlayListPage = await res.json();
        const editablePlaylists = page.items.filter(
            (playlist) => playlist.owner?.id === spotifyUserId || playlist.collaborative
        );

        allItems.push(...editablePlaylists);
        total = page.total;
        offset += page.items.length;

        if (page.items.length === 0) break;
    }

    return allItems
}

export async function getLikedTracksSummaryAction(): Promise<LikedTracksSummary> {
    const { accessToken } = await requireSpotifySession();

    const likedTracksRes = await fetch(
        'https://api.spotify.com/v1/me/tracks?limit=1',
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        }
    );

    if (!likedTracksRes.ok) {
        const body = await likedTracksRes.text();
        throw new Error(`Spotify ${likedTracksRes.status}: ${body}`);
    }

    const likedTracksPage = await likedTracksRes.json() as Pick<LikedTracksPage, 'total'>;

    return { total: likedTracksPage.total };
}

export async function clearLikedTracksAction() {
    const { accessToken } = await requireSpotifySession();

    const limit = 40;

    while (true) {
        const listRes = await fetch(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=0`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: 'no-store',
            }
        );

        if (!listRes.ok) {
            throw new Error(`Spotify ${listRes.status}: ${await listRes.text()}`);
        }

        const page: LikedTracksPage = await listRes.json();

        const uris = page.items.map((item) => item.track.uri);

        if (uris.length === 0) {
            break;
        }

        const params = new URLSearchParams();
        params.set('uris', uris.join(','));

        const deleteRes = await fetch(`https://api.spotify.com/v1/me/library?${params.toString()}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        });

        if (!deleteRes.ok) {
            const errorBody = await deleteRes.text();
            if (deleteRes.status === 403) {
                throw new Error(`Spotify 403 while deleting liked tracks from /v1/me/library: ${errorBody}`);
            }
            throw new Error(`Spotify ${deleteRes.status}: ${errorBody}`);
        }
    }

    revalidatePath('/');
}

export async function unfollowPlaylistAction(playlistUri: string) {
    const { accessToken } = await requireSpotifySession();

      const res = await fetch(
            `https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(playlistUri)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Spotify ${res.status}: ${body}`);
        }
}

export async function copyPlaylistAction(sourcePlaylistId: string, sourceName: string): Promise<PlayList> {
    const { accessToken } = await requireSpotifySession();

    // Fetch all track URIs from the source playlist
    const trackUris = await fetchAllPlaylistTrackUris(sourcePlaylistId, accessToken);

    // Create a new playlist for the current user
    const createRes = await fetch(`https://api.spotify.com/v1/me/playlists`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: `${sourceName} (Copy)`,
            public: false,
            description: `Copy of ${sourceName}`,
        }),
        cache: 'no-store',
    });

    if (!createRes.ok) {
        throw new Error(`Spotify ${createRes.status}: ${await createRes.text()}`);
    }

    const newPlaylist: PlayList & { tracks: { total: number } } = await createRes.json();

    // Add tracks in chunks of 100
    for (let offset = 0; offset < trackUris.length; offset += 100) {
        const chunk = trackUris.slice(offset, offset + 100);
        const addRes = await fetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/items`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
            cache: 'no-store',
        });

        if (!addRes.ok) {
            throw new Error(`Spotify ${addRes.status}: ${await addRes.text()}`);
        }
    }

    return {
        id: newPlaylist.id,
        name: newPlaylist.name,
        uri: newPlaylist.uri,
        collaborative: newPlaylist.collaborative,
        owner: newPlaylist.owner,
        items: { total: trackUris.length },
    };
}