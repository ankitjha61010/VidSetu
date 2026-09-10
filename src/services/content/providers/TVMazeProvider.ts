import { withCache } from '../cache';
import { TVMAZE_BASE_URL } from '../config';
import { CastMember, Episode, Season } from '../../../types';

// Supplementary TV metadata provider (per architecture spec) - normalizes TVmaze's
// HAL-style responses into our internal models. TVmaze has no TMDB-compatible ids,
// so it's looked up by show name and used only as a fallback/enrichment source when
// TMDB doesn't have data for a given TV show, never as the primary source.
async function tvmazeFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TVMAZE_BASE_URL}${path}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Show not found on TVmaze.');
    throw new Error(`TVmaze request failed (${res.status}).`);
  }
  return res.json();
}

function toSeason(raw: any): Season {
  return {
    seasonNumber: raw.number,
    name: raw.name || `Season ${raw.number}`,
    episodeCount: raw.episodeOrder || 0,
    posterUrl: raw.image?.medium || undefined,
    airDate: raw.premiereDate || undefined,
  };
}

function toEpisode(raw: any): Episode {
  return {
    episodeNumber: raw.number,
    seasonNumber: raw.season,
    name: raw.name,
    overview: (raw.summary || '').replace(/<[^>]+>/g, ''),
    stillUrl: raw.image?.medium || undefined,
    airDate: raw.airdate || undefined,
    runtimeMinutes: raw.runtime || undefined,
  };
}

export class TVMazeProvider {
  async findShowIdByName(name: string): Promise<number | null> {
    const results = await withCache(`tvmaze:search:${name}`, () =>
      tvmazeFetch<any[]>(`/search/shows?q=${encodeURIComponent(name)}`)
    );
    return results?.[0]?.show?.id ?? null;
  }

  async getSeasons(showId: number): Promise<Season[]> {
    const data = await withCache(`tvmaze:seasons:${showId}`, () => tvmazeFetch<any[]>(`/shows/${showId}/seasons`));
    return (data || []).map(toSeason);
  }

  async getEpisodes(showId: number, seasonNumber: number): Promise<Episode[]> {
    const data = await withCache(`tvmaze:episodes:${showId}`, () => tvmazeFetch<any[]>(`/shows/${showId}/episodes`));
    return (data || []).filter((e) => e.season === seasonNumber).map(toEpisode);
  }

  async getCast(showId: number): Promise<CastMember[]> {
    const data = await withCache(`tvmaze:cast:${showId}`, () => tvmazeFetch<any[]>(`/shows/${showId}/cast`));
    return (data || []).slice(0, 20).map((c) => ({
      id: c.person.id,
      name: c.person.name,
      character: c.character?.name,
      photoUrl: c.person.image?.medium || undefined,
    }));
  }
}

export const tvMazeProvider = new TVMazeProvider();
