import { PlaybackSource, PlaybackRequest } from '../../../../types';
import { findArchiveIdentifier } from '../../../../data/publicDomainClassics';
import { withCache } from '../../cache';

// Internet Archive playback source, built to satisfy the same PlaybackSource
// contract as every other provider. IA hosts a mix of public-domain and
// rights-cleared items alongside material that is not freely redistributable, so
// this NEVER does a generic "search archive.org for this title" - resolve() only
// returns a source when the movie's TMDB id is in the hand-curated, manually
// verified src/data/publicDomainClassics.ts list. Everything else falls through
// to the next provider in the resolver chain untouched.
export class InternetArchiveProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType !== 'movie') return null;
    const identifier = findArchiveIdentifier(request.tmdbId);
    if (!identifier) return null;
    return this.resolveByIdentifier(identifier);
  }

  async resolveByIdentifier(identifier: string): Promise<PlaybackSource | null> {
    try {
      const data = await withCache(`archive:${identifier}`, async () => {
        const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
        if (!res.ok) throw new Error(`archive.org metadata request failed (${res.status}).`);
        return res.json();
      });

      const files: any[] = data.files || [];
      const videoFile = files.find((f) => typeof f.name === 'string' && /\.(mp4|webm|m4v)$/i.test(f.name));
      if (!videoFile) return null;

      return {
        provider: 'INTERNET_ARCHIVE',
        type: 'video',
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(videoFile.name)}`,
        contentId: identifier,
      };
    } catch (err) {
      console.error('InternetArchiveProvider failed:', err);
      return null;
    }
  }
}

export const internetArchiveProvider = new InternetArchiveProvider();
