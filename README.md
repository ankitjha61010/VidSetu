# VidSetu (विद्सेतु) 🎥

> **Netflix-style movie & TV discovery platform with shared "Watch Spaces"**
> Metadata from TMDB (+ TVmaze), accounts & Watch Spaces in Supabase, deployable as a static site on Netlify.

---

## 🌟 Key Features

1. **Real movie/TV catalog** — trending, popular, genre browsing, filters (genre/year/sort), and unified search, all powered by [TMDB](https://www.themoviedb.org/) with TVmaze as a supplementary TV metadata source.
2. **Google sign-in via Supabase Auth** — no custom auth server; Supabase handles the OAuth flow and session.
3. **Watch Spaces** — a user creates one or more Watch Spaces (owner + members + role + status), each with its own watchlist and watch history. Member limits come from a `subscription_plans` lookup table (`FREE`/`PRO`/`BUSINESS`), never hard-coded, so billing can be layered on later without touching the data model.
4. **Provider-abstracted architecture** — the UI only talks to `ContentService` (metadata) and `PlaybackResolver` (playback). See `src/services/content/`. Swapping or adding a provider (e.g. a future licensed streaming API) means adding one file + one env var — no UI changes.
5. **Legal playback today: trailers only.** "Play" streams the official YouTube trailer via TMDB's `/videos` endpoint. Known piracy embed aggregators are intentionally not integrated. A `PaidStreamingProvider` stub is already wired into the fallback chain for when a licensed source is available.

---

## 🚀 Quick Start (Local Development)

### 1. Install dependencies
```bash
npm install
```

### 2. Get a TMDB API key
1. Create an account at [themoviedb.org](https://www.themoviedb.org/) → Settings → API.
2. Copy the **API Read Access Token** (v4 auth, a long JWT-looking string).

### 3. Create a Supabase project
1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Google**: enable it, reusing the Google OAuth Client ID/Secret from Google Cloud Console (Authorized redirect URI: your Supabase project's `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **SQL Editor**: paste and run `supabase/schema.sql` from this repo. This creates the `profiles`, `subscription_plans`, `watch_spaces`, `watch_space_members`, `watchlist_items`, and `watch_history` tables, all RLS policies, and the profile-on-signup trigger.
4. **Project Settings → API**: copy the Project URL and `anon` public key.

### 4. Configure environment
Copy `.env.example` to `.env` and fill in:
```env
VITE_TMDB_API_KEY=<your TMDB read access token>
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon key>
```

### 5. Run
```bash
npm run dev
```

---

## 🌐 Deploy to Netlify

```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod --dir=dist
```
Set the same three env vars above in Netlify's **Site configuration > Environment variables**. `netlify.toml` already configures the SPA redirect (`/* -> /index.html`) needed for client-side routing.

---

## 🏗️ Architecture

```
UI (pages/components)
   -> ContentService        (src/services/content/ContentService.ts)
        -> TMDBProvider     (primary metadata)
        -> TVMazeProvider   (supplementary TV metadata)
   -> PlaybackResolver      (src/services/content/playback/PlaybackResolver.ts)
        -> TrailerPlaybackProvider  (YouTube trailer via TMDB /videos - active today)
        -> PaidStreamingProvider    (stub - swap in a licensed provider later)
   -> watchSpaceService     (src/services/watchSpaceService.ts) -> Supabase (Postgres + RLS)
```

Replacing the playback source later requires only: implement `PaidStreamingProvider.resolve()` for real, add `paid` to `VITE_PLAYBACK_PROVIDERS`. Nothing in `MovieDetailsPage`, `SeriesDetailsPage`, `WatchPlayerPage`, or `VideoPlayer` needs to change.

See `supabase/schema.sql` for the full Watch Space data model (owner/members/roles/status, subscription-plan-driven `member_limit`, watchlist, watch history) and its RLS policies.
