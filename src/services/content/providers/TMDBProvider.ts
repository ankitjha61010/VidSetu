import { ContentProvider } from '../ContentProvider';
import { withCache } from '../cache';
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from '../config';
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
} from '../../../types';

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  // Use api_key parameter directly. Simple GET requests (without custom Authorization headers)
  // do NOT trigger CORS OPTIONS preflight requests, avoiding mobile cellular network & mobile browser CORS blocks.
  const apiKey = TMDB_API_KEY.startsWith('eyJ') ? '20a897e05c65d4b7eea801708be6be03' : TMDB_API_KEY;
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}).`);
  }
  return res.json();
}

function posterUrl(path: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE_URL}/w500${path}` : undefined;
}

function backdropUrl(path: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE_URL}/original${path}` : undefined;
}

function profileUrl(path: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE_URL}/w185${path}` : undefined;
}

function toMovie(raw: any): Movie {
  return {
    id: raw.id,
    mediaType: 'movie',
    title: raw.title || raw.original_title || 'Untitled',
    overview: raw.overview || '',
    posterUrl: posterUrl(raw.poster_path),
    backdropUrl: backdropUrl(raw.backdrop_path),
    releaseDate: raw.release_date || undefined,
    rating: raw.vote_average || 0,
    genreIds: raw.genre_ids || (raw.genres ? raw.genres.map((g: any) => g.id) : []),
    runtimeMinutes: raw.runtime || undefined,
  };
}

function toSeries(raw: any): TVSeries {
  return {
    id: raw.id,
    mediaType: 'tv',
    title: raw.name || raw.original_name || 'Untitled',
    overview: raw.overview || '',
    posterUrl: posterUrl(raw.poster_path),
    backdropUrl: backdropUrl(raw.backdrop_path),
    releaseDate: raw.first_air_date || undefined,
    rating: raw.vote_average || 0,
    genreIds: raw.genre_ids || (raw.genres ? raw.genres.map((g: any) => g.id) : []),
    numberOfSeasons: raw.number_of_seasons || undefined,
  };
}

function toCast(raw: any[]): CastMember[] {
  return (raw || []).slice(0, 20).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || undefined,
    photoUrl: profileUrl(c.profile_path),
  }));
}

export class TMDBProvider implements ContentProvider {
  async getTrending() {
    const data = await withCache('tmdb:trending', () => tmdbFetch<any>('/trending/all/week'));
    return (data.results || [])
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r: any) => (r.media_type === 'movie' ? toMovie(r) : toSeries(r)));
  }

  async getPopularMovies(page = 1): Promise<Movie[]> {
    const data = await withCache(`tmdb:popular-movies:${page}`, () =>
      tmdbFetch<any>('/movie/popular', { page })
    );
    return (data.results || []).map(toMovie);
  }

  async getPopularSeries(page = 1): Promise<TVSeries[]> {
    const data = await withCache(`tmdb:popular-tv:${page}`, () => tmdbFetch<any>('/tv/popular', { page }));
    return (data.results || []).map(toSeries);
  }

  async discoverMovies(filters: DiscoverFilters): Promise<Movie[]> {
    const key = `tmdb:discover-movie:${JSON.stringify(filters)}`;
    const data = await withCache(key, () =>
      tmdbFetch<any>('/discover/movie', {
        with_genres: filters.genreId,
        primary_release_year: filters.year,
        with_original_language: filters.language,
        sort_by: filters.sortBy || 'popularity.desc',
        page: filters.page || 1,
      })
    );
    return (data.results || []).map(toMovie);
  }

  async discoverSeries(filters: DiscoverFilters): Promise<TVSeries[]> {
    const key = `tmdb:discover-tv:${JSON.stringify(filters)}`;
    const data = await withCache(key, () =>
      tmdbFetch<any>('/discover/tv', {
        with_genres: filters.genreId,
        first_air_date_year: filters.year,
        with_original_language: filters.language,
        sort_by: filters.sortBy || 'popularity.desc',
        page: filters.page || 1,
      })
    );
    return (data.results || []).map(toSeries);
  }

  async getGenres(mediaType: 'movie' | 'tv'): Promise<Genre[]> {
    const data = await withCache(`tmdb:genres:${mediaType}`, () => tmdbFetch<any>(`/genre/${mediaType}/list`), 60 * 60 * 1000);
    return data.genres || [];
  }

  async searchMovies(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const data = await tmdbFetch<any>('/search/movie', { query });
    return (data.results || []).map(toMovie);
  }

  async searchSeries(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const data = await tmdbFetch<any>('/search/tv', { query });
    return (data.results || []).map(toSeries);
  }

  async getMovieDetails(id: number): Promise<MovieDetails> {
    const data = await withCache(`tmdb:movie:${id}`, () =>
      tmdbFetch<any>(`/movie/${id}`, { append_to_response: 'credits,similar' })
    );
    return {
      ...toMovie(data),
      genres: data.genres || [],
      cast: toCast(data.credits?.cast),
      relatedIds: (data.similar?.results || []).slice(0, 12).map((r: any) => r.id),
    };
  }

  async getSeriesDetails(id: number): Promise<SeriesDetails> {
    const data = await withCache(`tmdb:tv:${id}`, () =>
      tmdbFetch<any>(`/tv/${id}`, { append_to_response: 'credits,similar' })
    );
    const seasons: Season[] = (data.seasons || [])
      .filter((s: any) => s.season_number > 0)
      .map((s: any) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        posterUrl: posterUrl(s.poster_path),
        airDate: s.air_date || undefined,
      }));
    return {
      ...toSeries(data),
      genres: data.genres || [],
      cast: toCast(data.credits?.cast),
      seasons,
      relatedIds: (data.similar?.results || []).slice(0, 12).map((r: any) => r.id),
    };
  }

  async getSeasons(seriesId: number): Promise<Season[]> {
    const details = await this.getSeriesDetails(seriesId);
    return details.seasons;
  }

  async getEpisodes(seriesId: number, seasonNumber: number): Promise<Episode[]> {
    const data = await withCache(`tmdb:tv:${seriesId}:season:${seasonNumber}`, () =>
      tmdbFetch<any>(`/tv/${seriesId}/season/${seasonNumber}`)
    );
    return (data.episodes || []).map((e: any) => ({
      episodeNumber: e.episode_number,
      seasonNumber: e.season_number,
      name: e.name,
      overview: e.overview || '',
      stillUrl: e.still_path ? `${TMDB_IMAGE_BASE_URL}/w300${e.still_path}` : undefined,
      airDate: e.air_date || undefined,
      runtimeMinutes: e.runtime || undefined,
    }));
  }

  async getCast(id: number, mediaType: 'movie' | 'tv'): Promise<CastMember[]> {
    const details = mediaType === 'movie' ? await this.getMovieDetails(id) : await this.getSeriesDetails(id);
    return details.cast;
  }
}

export const tmdbProvider = new TMDBProvider();
