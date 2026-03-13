import { type NextAuthOptions } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import SpotifyProvider from 'next-auth/providers/spotify';

const spotifyScopes = [
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
].join(' ');

async function refreshSpotifyAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('Missing refresh token');
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify OAuth client credentials');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body,
    });

    const refreshed = await response.json();

    if (!response.ok) {
      throw refreshed;
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      accessToken: undefined,
      accessTokenExpires: undefined,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: spotifyScopes,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : undefined,
          refreshToken: account.refresh_token ?? token.refreshToken,
          spotifyUserId: account.providerAccountId,
          error: undefined,
        };
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires - 60_000) {
        return token;
      }

      return refreshSpotifyAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.spotifyUserId = token.spotifyUserId as string | undefined;
      session.error = token.error;
      return session;
    },
  },
};
