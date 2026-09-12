import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { X, Lock, ShieldCheck, ShieldAlert, Settings, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { watchSpaceService } from '../../services/watchSpaceService';
import { contentService } from '../../services/content/ContentService';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';

  const {
    spaces,
    requestSpaceSwitch,
    updateWatchSpaceName,
    deleteWatchSpace,
    isParentalPinEnabled,
    openParentalPinModal,
  } = useWatchSpace();
  const { showToast } = useToast();

  const space = spaces.find((s) => s.id === id);
  const [members, setMembers] = useState<WatchSpaceMember[]>([]);
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Space Name state
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Space state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSpace = async () => {
    if (!space) return;
    setIsDeleting(true);
    try {
      await deleteWatchSpace(space.id);
      showToast('Space Deleted', `${space.name} and all associated data have been removed.`, 'success');
      navigate('/spaces');
    } catch (err: any) {
      showToast('Failed to Delete', err.message, 'error');
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateWatchSpaceName(space.id, editName.trim(), space.isKids);
      showToast('Space Updated', editName.trim(), 'success');
      setShowEditName(false);
    } catch (err: any) {
      showToast('Failed to Update', err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{space.name}</h1>
            <button
              onClick={() => {
                setEditName(space.name);
                setShowEditName(true);
              }}
              title="Edit Space Name"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => {
              if (!space.isKids && isParentalPinEnabled) {
                requestSpaceSwitch(space.id, { forceCheck: true });
              } else {
                requestSpaceSwitch(space.id);
                navigate('/');
              }
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
          >
            Set as active Watch Space →
          </button>
        </div>
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
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">Space Details</h3>
            <p className="text-xs text-slate-400">Owner: {members.find((m) => m.role === 'OWNER')?.profile?.email || space.ownerId}</p>
            <p className="text-xs text-slate-400">Space Type: {space.isKids ? '👶 Kids Space' : 'General Watch Space'}</p>
            <p className="text-xs text-slate-400">Member limit: {space.memberLimit} (from your subscription plan)</p>
            <p className="text-xs text-slate-400">Created: {new Date(space.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Parental PIN Security</h4>
                  <p className="text-xs text-slate-400">Set, modify, or remove the 4-digit PIN for Kids Spaces.</p>
                </div>
              </div>

              {isParentalPinEnabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  <ShieldAlert className="w-3 h-3" /> Disabled
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Default PIN: <code className="text-indigo-300 font-mono font-bold">1234</code>
              </span>
              <button
                onClick={() => openParentalPinModal('changePin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                Change / Set PIN
              </button>
            </div>
          </div>

          {/* Danger Zone: Delete Space */}
          {space.ownerId === profile?.id && (
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Delete Watch Space</h4>
                    <p className="text-xs text-slate-400">
                      Permanently delete this space and all associated watchlists, history, and member data.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Space
                </button>
              </div>
            </div>
          )}
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

      {/* Edit Space Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <button
              onClick={() => setShowEditName(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                Edit Space Name
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rename your {space.isKids ? 'Kids Space' : 'Watch Space'}.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Space Name</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter space name"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditName(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Space Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Watch Space?</h3>
                <p className="text-xs text-rose-400 font-semibold mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                Deleting <strong className="text-white font-bold">"{space.name}"</strong> will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Watchlist and saved movies/series</li>
                <li>Continue Watching history and playback progress</li>
                <li>Space memberships and shared settings</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSpace}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting Everything...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
