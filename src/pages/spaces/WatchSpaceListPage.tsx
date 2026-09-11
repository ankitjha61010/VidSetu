import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Crown, X, Settings, CheckCircle2, Tv, Sparkles, Film, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWatchSpace } from '../../context/WatchSpaceContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const WatchSpaceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    spaces,
    currentSpace,
    isLoading,
    createWatchSpace,
    requestSpaceSwitch,
    openParentalPinModal,
  } = useWatchSpace();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [isKids, setIsKids] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createWatchSpace(name.trim(), isKids);
      showToast(isKids ? 'Kids Space Created 👶' : 'Watch Space Created', name.trim(), 'success');
      setShowCreate(false);
      setName('');
      setIsKids(false);
    } catch (err: any) {
      showToast('Failed to Create', err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState message="Loading your Watch Spaces..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Watch Spaces</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Signed in as <span className="text-slate-200 font-medium">{profile?.name || profile?.email}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsKids(false);
              setShowCreate(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Watch Space
          </button>

          <button
            onClick={() => {
              setIsKids(true);
              setShowCreate(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 font-bold text-xs sm:text-sm border border-amber-500/40 shadow-xl shadow-amber-950/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Create Kids Space 👶
          </button>
        </div>
      </div>



      {spaces.length === 0 ? (
        <EmptyState
          title="No Watch Spaces yet"
          description="Create your first Watch Space to start browsing and saving movies & shows."
          onAction={() => setShowCreate(true)}
          actionText="Create Watch Space"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {spaces.map((space) => {
            const isActive = currentSpace?.id === space.id;
            const spaceIsKids = Boolean(space.isKids);

            return (
              <div
                key={space.id}
                onClick={(e) => {
                  // Avoid triggering when clicking internal buttons/links like PIN or Manage
                  if ((e.target as HTMLElement).closest('button, a')) return;
                  requestSpaceSwitch(space.id);
                  navigate('/');
                }}
                className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? spaceIsKids
                      ? 'border-amber-400 bg-amber-950/25 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/80 animate-pulse'
                      : 'border-indigo-400 bg-indigo-950/25 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400/80 animate-pulse'
                    : spaceIsKids
                    ? 'border-amber-800/40 hover:border-amber-500/60 bg-amber-950/10 hover:shadow-lg hover:shadow-amber-950/20'
                    : 'border-slate-800/80 hover:border-indigo-500/50 bg-slate-900/40 hover:shadow-lg hover:shadow-indigo-950/20'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                          spaceIsKids
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800/90 border-slate-700/80 text-indigo-400'
                        }`}
                      >
                        {spaceIsKids ? <Sparkles className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">{space.name}</h3>
                      {space.ownerId === profile?.id && (
                        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {spaceIsKids && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          👶 Kids
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Member limit: {space.memberLimit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      requestSpaceSwitch(space.id);
                      navigate('/');
                    }}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? spaceIsKids
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                          : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                        : spaceIsKids
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isActive ? 'Browsing as Active' : spaceIsKids ? 'Enter Kids Space' : 'Select Space'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openParentalPinModal('changePin')}
                    title="Set or Change Security PIN"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Set PIN</span>
                  </button>

                  <Link
                    to={`/spaces/${space.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Create Watch Space</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select a space type for your new streaming environment.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Space Type</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsKids(false)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      !isKids
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Normal Space</span>
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">General movies, series & classics for everyone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsKids(true)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isKids
                        ? 'bg-amber-600/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kids Space 👶</span>
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">Child-safe cartoons, animation & family hits</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Space Name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isKids ? 'e.g. Junior Kids' : 'e.g. Family Watch Space'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50 ${
                  isKids
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {isCreating ? 'Creating...' : isKids ? 'Create Kids Space 👶' : 'Create Normal Space'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
