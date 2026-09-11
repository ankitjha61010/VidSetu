import { supabase } from '../lib/supabaseClient';
import {
  MediaType,
  WatchHistoryItem,
  WatchSpace,
  WatchSpaceMember,
  WatchlistItem,
} from '../types';

function mapWatchSpace(row: any): WatchSpace {
  const rawName = row.name || '';
  const isKids = Boolean(
    row.is_kids ||
    rawName.startsWith('👶 ') ||
    rawName.startsWith('[Kids] ') ||
    rawName.endsWith(' [Kids]') ||
    row.subscription_plan_id === 'KIDS'
  );
  const cleanName = rawName
    .replace(/^👶\s*/, '')
    .replace(/^\[Kids\]\s*/, '')
    .replace(/\s*\[Kids\]$/, '');

  return {
    id: row.id,
    name: cleanName || rawName,
    ownerId: row.owner_id,
    subscriptionPlanId: row.subscription_plan_id,
    memberLimit: row.member_limit,
    isKids,
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

  async createWatchSpace(name: string, ownerId: string, isKids: boolean = false): Promise<WatchSpace> {
    const formattedName = isKids ? `👶 ${name.trim()}` : name.trim();
    const { data, error } = await supabase
      .from('watch_spaces')
      .insert({ name: formattedName, owner_id: ownerId, subscription_plan_id: 'FREE' })
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
    
    // Deduplicate by mediaType-tmdbId so each title only appears once at the newest position
    const mapped = (data || []).map(mapWatchHistoryItem);
    const seen = new Set<string>();
    const unique: WatchHistoryItem[] = [];
    for (const item of mapped) {
      const key = `${item.mediaType}-${item.tmdbId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
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
    // Check if a record already exists for this movie/show in this watch space
    const { data: existing } = await supabase
      .from('watch_history')
      .select('id')
      .eq('watch_space_id', entry.watchSpaceId)
      .eq('user_id', entry.userId)
      .eq('tmdb_id', entry.tmdbId)
      .eq('media_type', entry.mediaType)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing record with newest timestamp so it moves to first position
      const { error } = await supabase
        .from('watch_history')
        .update({
          season: entry.season ?? null,
          episode: entry.episode ?? null,
          progress_seconds: entry.progressSeconds,
          duration_seconds: entry.durationSeconds,
          last_watched_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
      if (error) console.error('Failed to update watch progress:', error);
    } else {
      // Insert new record
      const { error } = await supabase.from('watch_history').insert({
        watch_space_id: entry.watchSpaceId,
        user_id: entry.userId,
        tmdb_id: entry.tmdbId,
        media_type: entry.mediaType,
        season: entry.season ?? null,
        episode: entry.episode ?? null,
        progress_seconds: entry.progressSeconds,
        duration_seconds: entry.durationSeconds,
        last_watched_at: new Date().toISOString(),
      });
      if (error) console.error('Failed to insert watch progress:', error);
    }
  },
};
