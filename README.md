# Spotify shuffler

## Functionality

* Shuffle Spotify playlist - randomly reorders tracks in the playlist. This is to circumvent lack of ability to play tracks truly randomly in the playlist, because Spotify starts prefering small subset of tracks
* Copy Spotify playlist - creates a copy of the existing Spotify playlist with all the songs included
* Unfollow Spotify playlist - stops following the Spotify playlist, basically removes the playlist from the Library. Spotify does not allow to force delete the playlist as it can be followed by other users
* Shuffle Spotify Liked tracks - randomly reorders liked tracks. The liked tracks can only be ordered by insert time, so shuffling liked tracks works by randomly ordering the tracks and inserting them with delay to actually view the liked tracks shuffled
* Clear the Liked tracks - Spotify provides built-in playlist for the tracks that user likes, but does not provide an easy way to clear this playlist in the mobile apps

## local development

setup env variables in `.env.local`

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=somesecret
```

run app locally 

```
npm run dev -- --hostname 127.0.0.1
```

> [!NOTE]
> run on `127.0.0.1`, because spotify client app redirect uri cannot be configured to `http://localhost`, see [Spotify documentation](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)