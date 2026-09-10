import { PlaybackRequest, PlaybackSource } from '../../../../types';

export class StreamPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType === 'movie') {
      const tmdbId = request.tmdbId;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&autoplay=1`,
        contentId: String(tmdbId),
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc.me - Mobile & HD)', url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&autoplay=1` },
          { name: 'Server 2 (VidSrc.to)', url: `https://vidsrc.to/embed/movie/${tmdbId}?autoplay=1` },
          { name: 'Server 3 (2Embed HD)', url: `https://www.2embed.cc/embed/${tmdbId}` },
          { name: 'Server 4 (VidSrc.xyz)', url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}&autoplay=1` },
          { name: 'Server 5 (VidSrc Pro)', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}?autoPlay=true` },
        ],
      };
    } else {
      const tmdbId = request.tmdbId;
      const season = request.season ?? 1;
      const episode = request.episode ?? 1;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&autoplay=1`,
        contentId: String(tmdbId),
        season,
        episode,
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc.me - Mobile & HD)', url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&autoplay=1` },
          { name: 'Server 2 (VidSrc.to)', url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1` },
          { name: 'Server 3 (2Embed HD)', url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}` },
          { name: 'Server 4 (VidSrc.xyz)', url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&autoplay=1` },
          { name: 'Server 5 (VidSrc Pro)', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=true` },
        ],
      };
    }
  }
}

export const streamPlaybackProvider = new StreamPlaybackProvider();
