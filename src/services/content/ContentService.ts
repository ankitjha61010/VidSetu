import { tmdbProvider } from './providers/TMDBProvider';
import { tvMazeProvider } from './providers/TVMazeProvider';
import {
  CastMember,
  DiscoverFilters,
  Episode,
  Genre,
  Movie,
  MovieDetails,
  Season,
  SearchResult,
  SeriesDetails,
  TVSeries,
} from '../../types';

// The ONLY module the UI should import for content data. It knows which
// provider(s) are active; components never talk to TMDB/TVmaze directly.
class ContentServiceImpl {
  async getTrending(): Promise<(Movie | TVSeries)[]> {
    return tmdbProvider.getTrending();
  }

  async getPopularMovies(page?: number): Promise<Movie[]> {
    return tmdbProvider.getPopularMovies(page);
  }

  async getPopularSeries(page?: number): Promise<TVSeries[]> {
    return tmdbProvider.getPopularSeries(page);
  }

  async discoverMovies(filters: DiscoverFilters = {}): Promise<Movie[]> {
    return tmdbProvider.discoverMovies(filters);
  }

  async discoverSeries(filters: DiscoverFilters = {}): Promise<TVSeries[]> {
    return tmdbProvider.discoverSeries(filters);
  }

  async getGenres(mediaType: 'movie' | 'tv'): Promise<Genre[]> {
    return tmdbProvider.getGenres(mediaType);
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const [movies, series] = await Promise.all([
      tmdbProvider.searchMovies(query),
      tmdbProvider.searchSeries(query),
    ]);
    return [...movies, ...series].sort((a, b) => b.rating - a.rating);
  }

  async getMovieDetails(id: number): Promise<MovieDetails> {
    return tmdbProvider.getMovieDetails(id);
  }

  async getSeriesDetails(id: number): Promise<SeriesDetails> {
    return tmdbProvider.getSeriesDetails(id);
  }

  async getSeasons(seriesId: number): Promise<Season[]> {
    return tmdbProvider.getSeasons(seriesId);
  }

  async getEpisodes(seriesId: number, seasonNumber: number): Promise<Episode[]> {
    const episodes = await tmdbProvider.getEpisodes(seriesId, seasonNumber);
    if (episodes.length > 0) return episodes;

    // Enrichment fallback: some TMDB seasons are sparsely populated. Try TVmaze by title.
    try {
      const details = await tmdbProvider.getSeriesDetails(seriesId);
      const tvmazeId = await tvMazeProvider.findShowIdByName(details.title);
      if (tvmazeId) return tvMazeProvider.getEpisodes(tvmazeId, seasonNumber);
    } catch {
      // ignore - metadata errors here should not crash the details page
    }
    return episodes;
  }

  async getCast(id: number, mediaType: 'movie' | 'tv'): Promise<CastMember[]> {
    return tmdbProvider.getCast(id, mediaType);
  }
}

export const contentService = new ContentServiceImpl();
