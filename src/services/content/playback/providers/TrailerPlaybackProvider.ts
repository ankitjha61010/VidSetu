import { TMDB_API_KEY, TMDB_BASE_URL } from '../../config';
import { withCache } from '../../cache';
import { PlaybackRequest, PlaybackSource } from '../../../../types';

// The only playback provider wired up by default: fetches the real official
// trailer from TMDB's /videos endpoint and returns a YouTube embed source.
// Fully legal, works today, and exercises the exact same PlaybackResolver ->
// VideoPlayer pipeline a future licensed provider will use.
export class TrailerPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (!TMDB_API_KEY) return null;

    const path =
      request.mediaType === 'movie'
        ? `/movie/${request.tmdbId}/videos`
        : `/tv/${request.tmdbId}/videos`;

    try {
      const data = await withCache(`trailer:${request.mediaType}:${request.tmdbId}`, async () => {
        const res = await fetch(`${TMDB_BASE_URL}${path}`, {
          headers: { Authorization: `Bearer ${TMDB_API_KEY}`, Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`TMDB videos request failed (${res.status}).`);
        return res.json();
      });

      const results: any[] = data.results || [];
      const trailer =
        results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
        results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
        results.find((v) => v.site === 'YouTube');

      if (!trailer) return null;

      return {
        provider: 'YOUTUBE_TRAILER',
        type: 'iframe',
        url: `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`,
        contentId: String(request.tmdbId),
        season: request.season,
        episode: request.episode,
        isTrailer: true,
      };
    } catch (err) {
      console.error('TrailerPlaybackProvider failed:', err);
      return null;
    }
  }
}

export const trailerPlaybackProvider = new TrailerPlaybackProvider();
