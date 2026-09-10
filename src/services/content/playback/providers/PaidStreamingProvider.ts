import { PlaybackRequest, PlaybackSource } from '../../../../types';

// Placeholder for a future LICENSED streaming API. Intentionally always returns
// null today - this is the one file to replace (plus adding 'paid' to
// VITE_PLAYBACK_PROVIDERS) when a properly licensed provider is available.
// Nothing in MovieDetailsPage / SeriesDetailsPage / WatchPlayerPage / VideoPlayer
// needs to change when this file grows a real implementation.
//
// If the real provider requires a secret API key, do NOT call it directly from the
// browser here - route the request through a server-side function instead and have
// this method call that function.
export class PaidStreamingProvider {
  async resolve(_request: PlaybackRequest): Promise<PlaybackSource | null> {
    return null;
  }
}

export const paidStreamingProvider = new PaidStreamingProvider();
