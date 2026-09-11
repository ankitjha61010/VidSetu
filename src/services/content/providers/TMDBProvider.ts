import { ContentProvider } from '../ContentProvider';
import { withCache } from '../cache';
import { TMDB_API_KEY, TMDB_IMAGE_BASE_URL } from '../config';
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

const TMDB_MIRRORS = [
  'https://api.themoviedb.org/3',
  'https://api.tmdb.org/3',
];

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const apiKey = TMDB_API_KEY.startsWith('eyJ') ? '20a897e05c65d4b7eea801708be6be03' : TMDB_API_KEY;
  let lastError: any = null;

  for (const baseUrl of TMDB_MIRRORS) {
    try {
      const url = new URL(`${baseUrl}${path}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
      });
      url.searchParams.set('api_key', apiKey);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // Mobile cellular carrier (Jio/Airtel) CORS/DNS bypass proxy fallback
  try {
    const directUrl = new URL(`https://api.themoviedb.org/3${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') directUrl.searchParams.set(key, String(value));
    });
    directUrl.searchParams.set('api_key', apiKey);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl.toString())}`;
    const proxyRes = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
    if (proxyRes.ok) {
      return await proxyRes.json();
    }
  } catch {
    // ignore proxy error
  }

  throw lastError || new Error('TMDB request failed across all mirrors.');
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
      .filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && (!r.genre_ids || !r.genre_ids.includes(10762)))
      .map((r: any) => (r.media_type === 'movie' ? toMovie(r) : toSeries(r)));
  }

  async getKidsTrending() {
    const data = await withCache('tmdb:trending-kids', () =>
      tmdbFetch<any>('/discover/movie', {
        with_genres: '16|10751',
        sort_by: 'popularity.desc',
        page: 1,
      })
    );
    return (data.results || []).map(toMovie);
  }

  async getPopularMovies(page = 1): Promise<Movie[]> {
    const data = await withCache(`tmdb:popular-movies:${page}`, () =>
      tmdbFetch<any>('/movie/popular', { page })
    );
    return (data.results || []).map(toMovie);
  }

  async getKidsPopularMovies(page = 1): Promise<Movie[]> {
    const data = await withCache(`tmdb:kids-popular-movies:${page}`, () =>
      tmdbFetch<any>('/discover/movie', {
        with_genres: '16|10751',
        sort_by: 'popularity.desc',
        page,
      })
    );
    return (data.results || []).map(toMovie);
  }

  async getPopularSeries(page = 1): Promise<TVSeries[]> {
    const data = await withCache(`tmdb:popular-tv:${page}`, () => tmdbFetch<any>('/tv/popular', { page }));
    // Filter out kids-only series from normal TV list
    return (data.results || []).filter((s: any) => !s.genre_ids || !s.genre_ids.includes(10762)).map(toSeries);
  }

  async getKidsPopularSeries(page = 1): Promise<TVSeries[]> {
    const data = await withCache(`tmdb:kids-popular-tv:${page}`, () =>
      tmdbFetch<any>('/discover/tv', {
        with_genres: '16|10751|10762',
        sort_by: 'popularity.desc',
        page,
      })
    );
    return (data.results || []).map(toSeries);
  }

  async discoverMovies(filters: DiscoverFilters): Promise<Movie[]> {
    const key = `tmdb:discover-movie:${JSON.stringify(filters)}`;
    const genres = filters.isKids
      ? (filters.genreId ? String(filters.genreId) : '16|10751')
      : (filters.genreId ? String(filters.genreId) : undefined);

    const data = await withCache(key, () =>
      tmdbFetch<any>('/discover/movie', {
        with_genres: genres,
        without_genres: filters.isKids ? undefined : '10762',
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
    const genres = filters.isKids
      ? (filters.genreId ? String(filters.genreId) : '16|10751|10762')
      : (filters.genreId ? String(filters.genreId) : undefined);

    const data = await withCache(key, () =>
      tmdbFetch<any>('/discover/tv', {
        with_genres: genres,
        without_genres: filters.isKids ? undefined : '10762',
        first_air_date_year: filters.year,
        with_original_language: filters.language,
        sort_by: filters.sortBy || 'popularity.desc',
        page: filters.page || 1,
      })
    );
    return (data.results || []).map(toSeries);
  }

  async getGenres(mediaType: 'movie' | 'tv', isKids: boolean = false): Promise<Genre[]> {
    const data = await withCache(`tmdb:genres:${mediaType}`, () => tmdbFetch<any>(`/genre/${mediaType}/list`), 60 * 60 * 1000);
    const allGenres: Genre[] = data.genres || [];
    if (isKids) {
      // Return child-friendly genres
      const kidFriendlyIds = [16, 10751, 10762, 12, 35, 14, 10759]; // Animation, Family, Kids, Adventure, Comedy, Fantasy, Action & Adventure
      return allGenres.filter((g) => kidFriendlyIds.includes(g.id));
    }
    // For normal spaces, exclude kids-only genre (10762)
    return allGenres.filter((g) => g.id !== 10762);
  }

  async searchMovies(query: string, isKids: boolean = false): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const params: Record<string, string | number | undefined> = { query };
    if (isKids) params.include_adult = 'false';
    const data = await tmdbFetch<any>('/search/movie', params);
    const results = (data.results || []).map(toMovie);
    if (isKids) {
      const strictKidGenres = [16, 10751, 10762]; // Animation, Family, Kids
      return results.filter((item: SearchResult) => {
        if ((item as any).adult) return false;
        return item.genreIds && item.genreIds.some((gId: number) => strictKidGenres.includes(gId));
      });
    }
    return results;
  }

  async searchSeries(query: string, isKids: boolean = false): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const params: Record<string, string | number | undefined> = { query };
    if (isKids) params.include_adult = 'false';
    const data = await tmdbFetch<any>('/search/tv', params);
    const results = (data.results || []).map(toSeries);
    if (isKids) {
      const strictKidGenres = [16, 10751, 10762]; // Animation, Family, Kids
      return results.filter((item: SearchResult) => {
        if ((item as any).adult) return false;
        return item.genreIds && item.genreIds.some((gId: number) => strictKidGenres.includes(gId));
      });
    }
    return results;
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
