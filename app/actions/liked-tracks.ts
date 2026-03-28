'use server';

import { revalidatePath } from 'next/cache';
import { shuffleArray } from '@/app/lib/spotify';
import { requireSpotifySession } from './session';

export type LikedTracksSummary = {
    total: number;
};

type LikedTracksPage = {
    total: number;
    items: Array<{
        track: {
            uri: string;
        };
    }>;
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchAllLikedTrackUris(accessToken: string): Promise<string[]> {
    const limit = 50;
    let offset = 0;
    let total = Infinity;
    const uris: string[] = [];

    while (offset < total) {
        const res = await fetch(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: 'no-store',
            }
        );

        if (!res.ok) {
            throw new Error(`Spotify ${res.status}: ${await res.text()}`);
        }

        const page: LikedTracksPage = await res.json();
        uris.push(...page.items.map((item) => item.track.uri).filter(Boolean));
        total = page.total;
        offset += page.items.length;

        if (page.items.length === 0) break;
    }

    return uris;
}

async function removeLikedTracksByUris(trackUris: string[], accessToken: string) {
    const deleteLimit = 40;

    for (let offset = 0; offset < trackUris.length; offset += deleteLimit) {
        const chunk = trackUris.slice(offset, offset + deleteLimit);
        const params = new URLSearchParams();
        params.set('uris', chunk.join(','));

        const deleteRes = await fetch(`https://api.spotify.com/v1/me/library?${params.toString()}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
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
}

// Inserts tracks in reverse shuffled order with a delay between each batch so that
// Spotify's "Recently Added" (newest-first) ordering reflects the intended shuffle.
//
// Batch size is chosen so the total wall-clock time stays under TARGET_MS:
//   maxBatches = floor(TARGET_MS / delayMs) + 1   (gaps between N batches = N-1)
//   batchSize  = ceil(totalTracks / maxBatches), capped at the API limit of 40.
//
// For libraries larger than maxBatches * 40 tracks the time will exceed TARGET_MS,
// but we still use the largest allowed batch size to minimise the overshoot.
async function addLikedTracksInReverseWithDelay(
    shuffledUris: string[],
    accessToken: string,
    delayMs = 1100,
    targetMs = 10_000,
) {
    const reversed = [...shuffledUris].reverse();
    const apiLimit = 40;
    const maxBatches = Math.floor(targetMs / delayMs) + 1;
    const batchSize = Math.min(apiLimit, Math.ceil(reversed.length / maxBatches));

    for (let offset = 0; offset < reversed.length; offset += batchSize) {
        const chunk = reversed.slice(offset, offset + batchSize);
        const params = new URLSearchParams();
        params.set('uris', chunk.join(','));

        const addRes = await fetch(`https://api.spotify.com/v1/me/library?${params.toString()}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });

        if (!addRes.ok) {
            throw new Error(`Spotify ${addRes.status}: ${await addRes.text()}`);
        }

        if (offset + batchSize < reversed.length) {
            await delay(delayMs);
        }
    }
}

export async function getLikedTracksSummaryAction(): Promise<LikedTracksSummary> {
    const { accessToken } = await requireSpotifySession();

    const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Spotify ${res.status}: ${body}`);
    }

    const page = await res.json() as Pick<LikedTracksPage, 'total'>;
    return { total: page.total };
}

export async function shuffleLikedTracksAction() {
    const { accessToken } = await requireSpotifySession();

    const originalUris = await fetchAllLikedTrackUris(accessToken);
    if (originalUris.length <= 1) {
        revalidatePath('/');
        return;
    }

    const shuffledUris = shuffleArray(originalUris);

    await removeLikedTracksByUris(originalUris, accessToken);
    await addLikedTracksInReverseWithDelay(shuffledUris, accessToken);

    revalidatePath('/');
}

export async function clearLikedTracksAction() {
    const { accessToken } = await requireSpotifySession();

    const trackUris = await fetchAllLikedTrackUris(accessToken);
    await removeLikedTracksByUris(trackUris, accessToken);

    revalidatePath('/');
}
