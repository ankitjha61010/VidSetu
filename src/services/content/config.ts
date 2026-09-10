// Centralized provider configuration - never scatter provider names or URLs
// throughout the codebase. Change providers here (and via env vars), not in UI code.

export const CONTENT_PROVIDER = (import.meta.env.VITE_CONTENT_PROVIDER as string) || 'tmdb';

export const PLAYBACK_PROVIDERS: string[] = ((import.meta.env.VITE_PLAYBACK_PROVIDERS as string) || 'stream,archive,trailer')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMGE4OTdlMDVjNjVkNGI3ZWVhODAxNzA4YmU2YmUwMyIsIm5iZiI6MTc4OTAyNTE0My4zODUsInN1YiI6IjZhYTI1Yjc3MTQ0NTY1MmJkNDNjZGVjNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zAMkqtlWxog65FFM_GBMXC4h9C3PPAsYGosvYCxWQw4';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
