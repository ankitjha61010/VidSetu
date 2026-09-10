import { PlaybackRequest, PlaybackSource } from '../../../../types';

export class StreamPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType === 'movie') {
      const tmdbId = request.tmdbId;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}`,
        contentId: String(tmdbId),
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc CC - Mobile Fast)', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}` },
          { name: 'Server 2 (VidLink Pro)', url: `https://vidlink.pro/movie/${tmdbId}` },
          { name: 'Server 3 (VidSrc HD)', url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}` },
          { name: 'Server 4 (VidSrc IN)', url: `https://vidsrc.in/embed/movie/${tmdbId}` },
          { name: 'Server 5 (VidSrc XYZ)', url: `https://vidsrc.xyz/embed/movie/${tmdbId}` },
          { name: 'Server 6 (AutoEmbed)', url: `https://autoembed.co/movie/tmdb/${tmdbId}` },
          { name: 'Server 7 (SmashyStream)', url: `https://player.smashy.stream/movie/${tmdbId}` },
          { name: 'Server 8 (Embed.su)', url: `https://embed.su/embed/movie/${tmdbId}` },
        ],
      };
    } else {
      const tmdbId = request.tmdbId;
      const season = request.season ?? 1;
      const episode = request.episode ?? 1;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
        contentId: String(tmdbId),
        season,
        episode,
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidSrc CC - Mobile Fast)', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 2 (VidLink Pro)', url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 3 (VidSrc HD)', url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}` },
          { name: 'Server 4 (VidSrc IN)', url: `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 5 (VidSrc XYZ)', url: `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 6 (AutoEmbed)', url: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}` },
          { name: 'Server 7 (SmashyStream)', url: `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}` },
          { name: 'Server 8 (Embed.su)', url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}` },
        ],
      };
    }
  }
}

export const streamPlaybackProvider = new StreamPlaybackProvider();
