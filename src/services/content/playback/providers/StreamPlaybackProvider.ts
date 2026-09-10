import { PlaybackRequest, PlaybackSource } from '../../../../types';

export class StreamPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType === 'movie') {
      const tmdbId = request.tmdbId;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidlink.pro/movie/${tmdbId}`,
        contentId: String(tmdbId),
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidLink - Fast Mobile/4G/5G)', url: `https://vidlink.pro/movie/${tmdbId}` },
          { name: 'Server 2 (VidSrc CC HD)', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}` },
          { name: 'Server 3 (MultiEmbed)', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` },
          { name: 'Server 4 (AutoEmbed Pro)', url: `https://autoembed.co/movie/tmdb/${tmdbId}` },
          { name: 'Server 5 (VidSrc PM)', url: `https://vidsrc.pm/embed/movie/${tmdbId}` },
          { name: 'Server 6 (Embed.su)', url: `https://embed.su/embed/movie/${tmdbId}` },
          { name: 'Server 7 (VidSrc ME)', url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}` },
          { name: 'Server 8 (SmashyStream)', url: `https://player.smashy.stream/movie/${tmdbId}` },
        ],
      };
    } else {
      const tmdbId = request.tmdbId;
      const season = request.season ?? 1;
      const episode = request.episode ?? 1;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
        contentId: String(tmdbId),
        season,
        episode,
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidLink - Fast Mobile/4G/5G)', url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 2 (VidSrc CC HD)', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 3 (MultiEmbed)', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}` },
          { name: 'Server 4 (AutoEmbed Pro)', url: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}` },
          { name: 'Server 5 (VidSrc PM)', url: `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 6 (Embed.su)', url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}` },
          { name: 'Server 7 (VidSrc ME)', url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}` },
          { name: 'Server 8 (SmashyStream)', url: `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}` },
        ],
      };
    }
  }
}

export const streamPlaybackProvider = new StreamPlaybackProvider();
