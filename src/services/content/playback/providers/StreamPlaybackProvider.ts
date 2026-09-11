import { PlaybackRequest, PlaybackSource } from '../../../../types';

export class StreamPlaybackProvider {
  async resolve(request: PlaybackRequest): Promise<PlaybackSource | null> {
    if (request.mediaType === 'movie') {
      const tmdbId = request.tmdbId;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.in/embed/movie/${tmdbId}`,
        contentId: String(tmdbId),
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidLink - Fast HD)', url: `https://vidlink.pro/movie/${tmdbId}`, language: 'en' },
          { name: 'Server 2 (VidSrc CC)', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}`, language: 'en' },
          { name: 'Server 3 (AutoEmbed)', url: `https://autoembed.co/movie/tmdb/${tmdbId}`, language: 'en' },
          { name: 'Server 4 (Embed.su)', url: `https://embed.su/embed/movie/${tmdbId}`, language: 'en' },
          { name: 'Server 5 (SmashyStream)', url: `https://player.smashy.stream/movie/${tmdbId}`, language: 'en' },
        ],
        hindiServers: [
          { name: 'Server 1 (VidSrc IN - Indian Server)', url: `https://vidsrc.in/embed/movie/${tmdbId}`, language: 'hi' },
          { name: 'Server 2 (VidSrc VIP - Multi-Audio)', url: `https://vidsrc.vip/embed/movie/${tmdbId}`, language: 'hi' },
          { name: 'Server 3 (VidSrc PM - Dual Audio)', url: `https://vidsrc.pm/embed/movie/${tmdbId}`, language: 'hi' },
          { name: 'Server 4 (MultiEmbed - Hindi & Dual Audio)', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, language: 'hi' },
          { name: 'Server 5 (2Embed - Dual Audio)', url: `https://www.2embed.cc/embed/${tmdbId}`, language: 'hi' },
          { name: 'Server 6 (VidSrc ICU - Multi-Audio)', url: `https://vidsrc.icu/embed/movie/${tmdbId}`, language: 'hi' },
          { name: 'Server 7 (MoviesAPI Club)', url: `https://moviesapi.club/movie/${tmdbId}`, language: 'hi' },
          { name: 'Server 8 (SmashyStream)', url: `https://player.smashy.stream/movie/${tmdbId}`, language: 'hi' },
        ],
      };
    } else {
      const tmdbId = request.tmdbId;
      const season = request.season ?? 1;
      const episode = request.episode ?? 1;
      return {
        provider: 'FULL_STREAM',
        type: 'iframe',
        url: `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`,
        contentId: String(tmdbId),
        season,
        episode,
        isTrailer: false,
        servers: [
          { name: 'Server 1 (VidLink - Fast HD)', url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`, language: 'en' },
          { name: 'Server 2 (VidSrc CC)', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`, language: 'en' },
          { name: 'Server 3 (AutoEmbed)', url: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`, language: 'en' },
          { name: 'Server 4 (Embed.su)', url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`, language: 'en' },
        ],
        hindiServers: [
          { name: 'Server 1 (VidSrc IN - Indian Server)', url: `https://vidsrc.in/embed/tv/${tmdbId}/${season}/${episode}`, language: 'hi' },
          { name: 'Server 2 (VidSrc VIP - Multi-Audio)', url: `https://vidsrc.vip/embed/tv/${tmdbId}/${season}/${episode}`, language: 'hi' },
          { name: 'Server 3 (VidSrc PM - Dual Audio)', url: `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`, language: 'hi' },
          { name: 'Server 4 (MultiEmbed - Hindi & Dual Audio)', url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`, language: 'hi' },
          { name: 'Server 5 (2Embed - Dual Audio)', url: `https://www.2embed.cc/embedTV/${tmdbId}&s=${season}&e=${episode}`, language: 'hi' },
          { name: 'Server 6 (VidSrc ICU)', url: `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`, language: 'hi' },
        ],
      };
    }
  }
}

export const streamPlaybackProvider = new StreamPlaybackProvider();
