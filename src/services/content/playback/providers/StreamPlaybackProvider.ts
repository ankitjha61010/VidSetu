import { PlaybackRequest, PlaybackSource } from '../../../../types';

export class StreamPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType === 'movie') {
      const tmdbId = request.tmdbId;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
        contentId: String(tmdbId),
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc HD)', url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}` },
          { name: 'Server 2 (VidLink Pro)', url: `https://vidlink.pro/movie/${tmdbId}` },
          { name: 'Server 3 (AutoEmbed)', url: `https://autoembed.co/movie/tmdb/${tmdbId}` },
          { name: 'Server 4 (VidSrc.to)', url: `https://vidsrc.to/embed/movie/${tmdbId}` },
          { name: 'Server 5 (2Embed)', url: `https://www.2embed.cc/embed/${tmdbId}` },
        ],
      };
    } else {
      const tmdbId = request.tmdbId;
      const season = request.season ?? 1;
      const episode = request.episode ?? 1;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
        contentId: String(tmdbId),
        season,
        episode,
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc HD)', url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}` },
          { name: 'Server 2 (VidLink Pro)', url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 3 (AutoEmbed)', url: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}` },
          { name: 'Server 4 (VidSrc.to)', url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 5 (2Embed)', url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}` },
        ],
      };
    }
  }
}

export const streamPlaybackProvider = new StreamPlaybackProvider();
