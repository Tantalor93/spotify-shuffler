import { type NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

const spotifyScopes = [
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
].join(' ');

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
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.providerAccountId) {
        token.spotifyUserId = account.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.spotifyUserId = token.spotifyUserId as string | undefined;
      return session;
    },
  },
};
