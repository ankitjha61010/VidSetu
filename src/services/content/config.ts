// Centralized provider configuration - never scatter provider names or URLs
// throughout the codebase. Change providers here (and via env vars), not in UI code.

export const CONTENT_PROVIDER = (import.meta.env.VITE_CONTENT_PROVIDER as string) || 'tmdb';

export const PLAYBACK_PROVIDERS: string[] = ((import.meta.env.VITE_PLAYBACK_PROVIDERS as string) || 'trailer')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY as string) || '';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
