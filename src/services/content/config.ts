// Centralized provider configuration - never scatter provider names or URLs
// throughout the codebase. Change providers here (and via env vars), not in UI code.

export const CONTENT_PROVIDER = (import.meta.env.VITE_CONTENT_PROVIDER as string) || 'tmdb';

export const PLAYBACK_PROVIDERS: string[] = ((import.meta.env.VITE_PLAYBACK_PROVIDERS as string) || 'stream,archive,trailer')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) || '20a897e05c65d4b7eea801708be6be03';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
