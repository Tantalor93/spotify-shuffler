# Spotify shuffler

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