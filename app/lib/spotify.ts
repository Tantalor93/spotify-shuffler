import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const redirectUri = "http://127.0.0.1:3000";

type PlaylistItemsPage = {
    items: Array<{ item?: { uri?: string | null } }>;
    total: number;
};

export const getSpotifySDK = () => {
    if (typeof window === "undefined") return null;

    return SpotifyApi.withUserAuthorization(
        clientId,
        redirectUri,
        ["playlist-read-private", "playlist-modify-private", "playlist-modify-public"]
    );
};

export function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export async function fetchAllPlaylistTrackUris(playlistId: string, accessToken: string): Promise<string[]> {
    const limit = 100;
    let offset = 0;
    let total = Infinity;
    const allItems: Array<{ item?: { uri?: string | null } }> = [];

    while (offset < total) {
        const res = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=${limit}&offset=${offset}`,
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

        const page: PlaylistItemsPage = await res.json();
        allItems.push(...page.items);
        total = page.total;
        offset += page.items.length;

        if (page.items.length === 0) break;
    }


    return allItems
        .map((i) => i.item?.uri)
        .filter((uri): uri is string => Boolean(uri));
}

export async function updatePlayList(playlistId: string, trackUris: string[], accessToken: string) {
    const limit = 100;
    let offset = 0;

    const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/items`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            method: "PUT",
            body: JSON.stringify({
                uris: [],
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Spotify ${res.status}: ${body}`);
    }

    console.debug("Cleared playlist:", res);

    while (offset < trackUris.length) {
        const chunk = trackUris.slice(offset, offset + limit);

        const res = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/items`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                method: "POST",
                body: JSON.stringify({
                    uris: chunk,
                    position: offset,
                }),
            }
        );

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Spotify ${res.status}: ${body}`);
        }

        console.debug("Added chunk:", res);

        offset += chunk.length
    }
}