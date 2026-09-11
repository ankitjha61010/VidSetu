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

// The contract every metadata provider must satisfy. ContentService is the only
// thing the UI talks to - it depends on this interface, never on a concrete provider.
export interface ContentProvider {
  getTrending(): Promise<MediaItemUnion[]>;
  getPopularMovies(page?: number): Promise<Movie[]>;
  getPopularSeries(page?: number): Promise<TVSeries[]>;
  discoverMovies(filters: DiscoverFilters): Promise<Movie[]>;
  discoverSeries(filters: DiscoverFilters): Promise<TVSeries[]>;
  getGenres(mediaType: 'movie' | 'tv', isKids?: boolean): Promise<Genre[]>;
  searchMovies(query: string): Promise<SearchResult[]>;
  searchSeries(query: string): Promise<SearchResult[]>;
  getMovieDetails(id: number): Promise<MovieDetails>;
  getSeriesDetails(id: number): Promise<SeriesDetails>;
  getSeasons(seriesId: number): Promise<Season[]>;
  getEpisodes(seriesId: number, seasonNumber: number): Promise<Episode[]>;
  getCast(id: number, mediaType: 'movie' | 'tv'): Promise<CastMember[]>;
}

type MediaItemUnion = Movie | TVSeries;
