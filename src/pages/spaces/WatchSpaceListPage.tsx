import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Crown, X, Settings, CheckCircle2, Tv, Sparkles, Film, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWatchSpace } from '../../context/WatchSpaceContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const WatchSpaceListPage: React.FC = () => {
  const { profile } = useAuth();
  const {
    spaces,
    currentSpace,
    isLoading,
    createWatchSpace,
    requestSpaceSwitch,
    isParentalPinEnabled,
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

      {/* Parental Lock & PIN Protection Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
            isParentalPinEnabled
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Kids Space Parental PIN</h3>
              {isParentalPinEnabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Enabled & Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  <ShieldAlert className="w-3 h-3" /> Removed / Disabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isParentalPinEnabled
                ? 'PIN is required to exit Kids Space and switch to general spaces.'
                : 'PIN lock is currently turned OFF. Anyone can switch spaces without entering a PIN.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {isParentalPinEnabled ? (
            <>
              <button
                type="button"
                onClick={() => openParentalPinModal('removePin')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-500/40 hover:text-rose-300 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Remove PIN
              </button>
              <button
                type="button"
                onClick={() => openParentalPinModal('changePin')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                Change PIN
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openParentalPinModal('changePin')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Enable / Set PIN
            </button>
          )}
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
                className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isActive
                    ? spaceIsKids
                      ? 'border-amber-500/50 bg-amber-950/15 shadow-lg shadow-amber-950/30'
                      : 'border-indigo-500/50 bg-indigo-950/15 shadow-lg shadow-indigo-950/30'
                    : spaceIsKids
                    ? 'border-amber-800/40 hover:border-amber-700/60 bg-amber-950/10'
                    : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/40'
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
                    onClick={() => requestSpaceSwitch(space.id)}
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
