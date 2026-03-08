import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;

export type PlayList = {
    id: string;
    name: string;
    items: { total: string };
}

type PlayListPage = {
    total: number;
    items: Array<PlayList>;
}

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

export async function userPlaylists(accessToken: string): Promise<PlayList[]> {
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
        allItems.push(...page.items);
        total = page.total;
        offset += page.items.length;

        if (page.items.length === 0) break;
    }


    return allItems
}