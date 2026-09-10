import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { watchSpaceService } from '../../services/watchSpaceService';
import { contentService } from '../../services/content/ContentService';
import { useWatchSpace } from '../../context/WatchSpaceContext';
import { useToast } from '../../context/ToastContext';
import { MediaRow } from '../../components/media/MediaRow';
import { MembersTable } from '../../components/watchspace/MembersTable';
import { LoadingState } from '../../components/common/LoadingState';
import { MediaItem, WatchSpaceMember } from '../../types';

const TABS = ['overview', 'watchlist', 'members', 'settings'] as const;
type Tab = (typeof TABS)[number];

export const WatchSpaceDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';

  const { spaces, setCurrentSpaceId } = useWatchSpace();
  const { showToast } = useToast();

  const space = spaces.find((s) => s.id === id);
  const [members, setMembers] = useState<WatchSpaceMember[]>([]);
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([watchSpaceService.listMembers(id), watchSpaceService.listWatchlist(id)])
      .then(async ([memberRows, watchlistRows]) => {
        if (cancelled) return;
        setMembers(memberRows);
        const items = await Promise.all(
          watchlistRows.map((w) =>
            w.mediaType === 'movie'
              ? contentService.getMovieDetails(w.tmdbId).catch(() => null)
              : contentService.getSeriesDetails(w.tmdbId).catch(() => null)
          )
        );
        if (!cancelled) setWatchlist(items.filter(Boolean) as MediaItem[]);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await watchSpaceService.inviteMemberByEmail(id, inviteEmail.trim());
      showToast('Member Added', inviteEmail.trim(), 'success');
      setShowInvite(false);
      setInviteEmail('');
      const memberRows = await watchSpaceService.listMembers(id);
      setMembers(memberRows);
    } catch (err: any) {
      showToast('Invite Failed', err.message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  if (!id) return <Navigate to="/spaces" replace />;
  if (!space) {
    return (
      <div className="py-24">
        <LoadingState message="Loading Watch Space..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{space.name}</h1>
        <button
          onClick={() => setCurrentSpaceId(space.id)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
        >
          Set as active Watch Space →
        </button>
      </div>

      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSearchParams({ tab: t })}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Loading..." />
      ) : tab === 'overview' ? (
        <div className="space-y-8">
          <MediaRow title="Watchlist" items={watchlist} emptyMessage="No items saved yet." />
        </div>
      ) : tab === 'watchlist' ? (
        <MediaRow title="Watchlist" items={watchlist} emptyMessage="No items saved yet." />
      ) : tab === 'members' ? (
        <MembersTable space={space} members={members} onInvite={() => setShowInvite(true)} />
      ) : (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <h3 className="text-sm font-bold text-white">Settings</h3>
          <p className="text-xs text-slate-400">Owner: {members.find((m) => m.role === 'OWNER')?.profile?.email || space.ownerId}</p>
          <p className="text-xs text-slate-400">Member limit: {space.memberLimit} (from your subscription plan)</p>
          <p className="text-xs text-slate-400">Created: {new Date(space.createdAt).toLocaleDateString()}</p>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <button
              onClick={() => setShowInvite(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Invite Member</h3>
            <p className="text-xs text-slate-400 mb-4">
              They must have already signed in to VidSetu with this Google account once.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <input
                autoFocus
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isInviting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
