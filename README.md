# Trackarr

A local dashboard for **UNIT3D** private trackers: per-tracker stats (ratio, buffer, seeding, and more) and a unified **Latest Releases** RSS feed grid from your configured sources.

## Screenshots

![Trackarr screenshot 1](https://i.imgur.com/wG5quLX.png)

![Trackarr screenshot 2](https://i.imgur.com/2B8sFSq.png)

![Trackarr screenshot 3](https://i.imgur.com/QCwH9i3.png)

![Trackarr screenshot 4](https://imgur.com/tlP8ho3.png)


## Requirements

- **Node.js** 22.12 or newer
- **pnpm** (recommended)

## Quick start

```bash
pnpm install
cp .env.example .env
```

Edit `.env` and set `TMDB_API_KEY` if you want poster images filled in when a release has no poster in the feed. You can create a free key at [TMDb API settings](https://www.themoviedb.org/settings/api). The app runs without it; only missing posters are affected.

```bash
pnpm dev
```

Open the URL shown in the terminal (see `server.port` in `astro.config.mjs`, usually `http://localhost:6875`).

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `pnpm dev`     | Development server with hot reload   |
| `pnpm build`   | Production build (`dist/`)           |
| `pnpm preview` | Serve the production build locally   |

## How it works

- **Trackers** are added in the **Add Tracker** modal (base URL, API token, and optional RSS key). Credentials are stored only on this machine under `data/trackers.json` (see `.gitignore`).
- **Stats** use the UNIT3D **API** when an API key is present.
- **Latest Releases** prefer the API when configured; otherwise releases are loaded from the UNIT3D **RSS** URL built from your base URL and RSS key (`/rss/{feedId}.{rsskey}`). RSS feeds are **UNIT3D-only**; use an API key when your tracker supports it.
- The UI is **English** and **Spanish** (language switcher in the header).

## Production

Build the app, then run the Node adapter output (see [Astro SSR with `@astrojs/node`](https://docs.astro.build/en/guides/server-side-rendering/)). Set `TMDB_API_KEY` in the environment where the server runs.

The HTTP port and listen address for both `pnpm dev` and the production Node server are set in [`astro.config.mjs`](astro.config.mjs) under `server.port` and `server.host` (currently **6875** and all interfaces). Change them there and rebuild before publishing a new image.

### Docker

Image on Docker Hub: [`gonzaloarielrossiar/trackarr`](https://hub.docker.com/r/gonzaloarielrossiar/trackarr).

#### Docker Compose

```
services:
  trackarr:
    image: gonzaloarielrossiar/trackarr:latest
    container_name: trackarr
    ports:
      - "6875:6875"
    environment:
      TMDB_API_KEY: ${TMDB_API_KEY:-} # Optional, but recommended for poster rss feeds that don't provide posters
    volumes:
      - trackarr_data:/app/data
    restart: unless-stopped

volumes:
  trackarr_data:

```


```bash
export TMDB_API_KEY=your_key
docker compose up -d
```

#### Docker CLI (`docker run`)

Run the same image without Compose:

```bash
docker pull gonzaloarielrossiar/trackarr:latest
```

The image listens on the port baked in at build time from `server.port` in `astro.config.mjs` (currently **6875**). Map it explicitly on the host:

```bash
# Foreground
docker run --rm --name trackarr -p 6875:6875 \
  -v trackarr_data:/app/data \
  gonzaloarielrossiar/trackarr:latest

# Detached, with TMDb key
docker run -d --name trackarr --restart unless-stopped \
  -p 6875:6875 \
  -v trackarr_data:/app/data \
  -e TMDB_API_KEY=your_key \
  gonzaloarielrossiar/trackarr:latest
```

Replace `your_key` or omit `-e TMDB_API_KEY=...` if you do not use TMDb. Use `docker stop trackarr` and `docker rm trackarr` to stop and remove the container; the volume `trackarr_data` keeps your data until you remove it with `docker volume rm trackarr_data`.