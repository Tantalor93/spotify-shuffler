import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireSpotifySession(): Promise<{ accessToken: string; spotifyUserId?: string }> {
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
