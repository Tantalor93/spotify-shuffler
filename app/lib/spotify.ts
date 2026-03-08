import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;


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
