import { supabase } from '../lib/supabaseClient';
import {
  MediaType,
  WatchHistoryItem,
  WatchSpace,
  WatchSpaceMember,
  WatchlistItem,
} from '../types';

function mapWatchSpace(row: any): WatchSpace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    subscriptionPlanId: row.subscription_plan_id,
    memberLimit: row.member_limit,
    createdAt: row.created_at,
  };
}

function mapMember(row: any): WatchSpaceMember {
  return {
    watchSpaceId: row.watch_space_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    profile: row.profiles
      ? {
          id: row.profiles.id,
          email: row.profiles.email,
          name: row.profiles.name,
          avatarUrl: row.profiles.avatar_url || undefined,
          createdAt: row.profiles.created_at,
        }
      : undefined,
  };
}

function mapWatchlistItem(row: any): WatchlistItem {
  return {
    id: row.id,
    watchSpaceId: row.watch_space_id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    addedBy: row.added_by,
    addedAt: row.added_at,
  };
}

function mapWatchHistoryItem(row: any): WatchHistoryItem {
  return {
    id: row.id,
    watchSpaceId: row.watch_space_id,
    userId: row.user_id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    season: row.season ?? undefined,
    episode: row.episode ?? undefined,
    progressSeconds: row.progress_seconds,
    durationSeconds: row.duration_seconds,
    lastWatchedAt: row.last_watched_at,
  };
}

// Keeps every Supabase query/mutation for Watch Spaces out of components,
// mirroring how ContentService keeps provider calls out of components.
export const watchSpaceService = {
  async listMySpaces(userId: string): Promise<WatchSpace[]> {
    const { data, error } = await supabase
      .from('watch_space_members')
      .select('watch_spaces(*)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');
    if (error) throw error;
    return (data || []).map((row: any) => mapWatchSpace(row.watch_spaces)).filter(Boolean);
  },

  async createWatchSpace(name: string, ownerId: string): Promise<WatchSpace> {
    const { data, error } = await supabase
      .from('watch_spaces')
      .insert({ name, owner_id: ownerId, subscription_plan_id: 'FREE' })
      .select()
      .single();
    if (error) throw error;
    return mapWatchSpace(data);
  },

  async listMembers(watchSpaceId: string): Promise<WatchSpaceMember[]> {
    const { data, error } = await supabase
      .from('watch_space_members')
      .select('*, profiles(*)')
      .eq('watch_space_id', watchSpaceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapMember);
  },

  async listWatchlist(watchSpaceId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('watch_space_id', watchSpaceId)
      .order('added_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapWatchlistItem);
  },

  async addToWatchlist(watchSpaceId: string, tmdbId: number, mediaType: MediaType, addedBy: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist_items')
      .insert({ watch_space_id: watchSpaceId, tmdb_id: tmdbId, media_type: mediaType, added_by: addedBy });
    if (error && error.code !== '23505') throw error; // ignore duplicate-add conflicts
  },

  async removeFromWatchlist(watchSpaceId: string, tmdbId: number, mediaType: MediaType): Promise<void> {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watch_space_id', watchSpaceId)
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType);
    if (error) throw error;
  },

  async inviteMemberByEmail(watchSpaceId: string, email: string): Promise<void> {
    const { error } = await supabase.rpc('invite_member_by_email', {
      space_id: watchSpaceId,
      invitee_email: email,
    });
    if (error) throw error;
  },

  async listWatchHistory(watchSpaceId: string): Promise<WatchHistoryItem[]> {
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('watch_space_id', watchSpaceId)
      .order('last_watched_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapWatchHistoryItem);
  },

  async upsertWatchProgress(entry: {
    watchSpaceId: string;
    userId: string;
    tmdbId: number;
    mediaType: MediaType;
    season?: number;
    episode?: number;
    progressSeconds: number;
    durationSeconds: number;
  }): Promise<void> {
    const { error } = await supabase.from('watch_history').upsert(
      {
        watch_space_id: entry.watchSpaceId,
        user_id: entry.userId,
        tmdb_id: entry.tmdbId,
        media_type: entry.mediaType,
        season: entry.season ?? null,
        episode: entry.episode ?? null,
        progress_seconds: entry.progressSeconds,
        duration_seconds: entry.durationSeconds,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'watch_space_id,user_id,tmdb_id,media_type,season,episode' }
    );
    if (error) throw error;
  },
};
