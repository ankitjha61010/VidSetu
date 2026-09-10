// --- Auth / Profile ---

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

// --- Content metadata (normalized; UI never sees raw provider shapes) ---

export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface MediaBase {
  id: number; // TMDB id
  mediaType: MediaType;
  title: string;
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  rating: number; // 0-10
  genreIds: number[];
}

export interface Movie extends MediaBase {
  mediaType: 'movie';
  runtimeMinutes?: number;
}

export interface TVSeries extends MediaBase {
  mediaType: 'tv';
  numberOfSeasons?: number;
}

export type MediaItem = Movie | TVSeries;

export interface MovieDetails extends Movie {
  genres: Genre[];
  cast: CastMember[];
  relatedIds: number[];
}

export interface SeriesDetails extends TVSeries {
  genres: Genre[];
  cast: CastMember[];
  seasons: Season[];
  relatedIds: number[];
}

export interface Season {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl?: string;
  airDate?: string;
}

export interface Episode {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillUrl?: string;
  airDate?: string;
  runtimeMinutes?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  photoUrl?: string;
}

export interface SearchResult extends MediaBase {}

export interface DiscoverFilters {
  genreId?: number;
  year?: number;
  language?: string; // ISO 639-1 original-language code, e.g. 'en', 'hi', 'ta'
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'primary_release_date.desc';
  page?: number;
}

// --- Playback ---

export type PlaybackProviderName = 'FULL_STREAM' | 'YOUTUBE_TRAILER' | 'PAID_STREAMING' | 'INTERNET_ARCHIVE';

export interface PlaybackServer {
  name: string;
  url: string;
}

export interface PlaybackRequest {
  mediaType: MediaType;
  tmdbId: number;
  season?: number;
  episode?: number;
}

export interface PlaybackSource {
  provider: PlaybackProviderName;
  type: 'iframe' | 'video';
  url: string;
  contentId: string;
  season?: number;
  episode?: number;
  isTrailer?: boolean;
  servers?: PlaybackServer[];
}

// --- Watch Space domain model (subscription-ready, no limits hard-coded) ---

export type WatchSpaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type WatchSpaceMemberStatus = 'ACTIVE' | 'INVITED' | 'REMOVED';

export interface SubscriptionPlan {
  id: string;
  name: string;
  memberLimit: number;
  status: string;
}

export interface WatchSpace {
  id: string;
  name: string;
  ownerId: string;
  subscriptionPlanId?: string | null;
  memberLimit: number;
  createdAt: string;
}

export interface WatchSpaceMember {
  watchSpaceId: string;
  userId: string;
  role: WatchSpaceRole;
  status: WatchSpaceMemberStatus;
  joinedAt: string;
  createdAt: string;
  profile?: Profile;
}

export interface WatchlistItem {
  id: string;
  watchSpaceId: string;
  tmdbId: number;
  mediaType: MediaType;
  addedBy: string;
  addedAt: string;
}

export interface WatchHistoryItem {
  id: string;
  watchSpaceId: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  progressSeconds: number;
  durationSeconds: number;
  lastWatchedAt: string;
}

// --- UI ---

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
