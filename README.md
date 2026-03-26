# Trackarr

A local dashboard for **UNIT3D** private trackers: per-tracker stats (ratio, buffer, seeding, and more) and a unified **Latest Releases** grid from your configured sources.

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

Open the URL shown in the terminal (usually `http://localhost:4321`).

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
