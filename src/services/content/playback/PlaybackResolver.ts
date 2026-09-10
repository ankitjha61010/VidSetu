import { PLAYBACK_PROVIDERS } from '../config';
import { trailerPlaybackProvider } from './providers/TrailerPlaybackProvider';
import { paidStreamingProvider } from './providers/PaidStreamingProvider';
import { internetArchiveProvider } from './providers/InternetArchiveProvider';
import { Episode, PlaybackRequest, PlaybackSource, TVSeries, Movie } from '../../../types';

type ResolveFn = (request: PlaybackRequest) => Promise<PlaybackSource | null>;

// Registry of resolvable playback providers, keyed by the name used in
// VITE_PLAYBACK_PROVIDERS. Add a provider here (and to the env var) to include
// it in the fallback chain - the UI never needs to know this list exists.
const PROVIDER_REGISTRY: Record<string, ResolveFn> = {
  archive: (req) => internetArchiveProvider.resolve(req),
  trailer: (req) => trailerPlaybackProvider.resolve(req),
  paid: (req) => paidStreamingProvider.resolve(req),
};

// Walks the configured provider chain in order and returns the first source
// that resolves. Never throws on an individual provider failing - a broken or
// unavailable provider is simply skipped so the resolver can fall through.
class PlaybackResolverImpl {
  private async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    for (const name of PLAYBACK_PROVIDERS) {
      const resolver = PROVIDER_REGISTRY[name];
      if (!resolver) continue;
      try {
        const source = await resolver(request);
        if (source) return source;
      } catch (err) {
        console.error(`Playback provider "${name}" failed:`, err);
      }
    }
    return null;
  }

  async resolveMovie(movie: Movie): Promise<PlaybackSource | null> {
    return this.resolve({ mediaType: 'movie', tmdbId: movie.id });
  }

  async resolveEpisode(series: TVSeries, episode: Episode): Promise<PlaybackSource | null> {
    return this.resolve({
      mediaType: 'tv',
      tmdbId: series.id,
      season: episode.seasonNumber,
      episode: episode.episodeNumber,
    });
  }
}

export const playbackResolver = new PlaybackResolverImpl();
