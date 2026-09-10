import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Crown, X, Settings, CheckCircle2, Tv } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWatchSpace } from '../../context/WatchSpaceContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const WatchSpaceListPage: React.FC = () => {
  const { profile } = useAuth();
  const { spaces, currentSpace, isLoading, createWatchSpace, setCurrentSpaceId } = useWatchSpace();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createWatchSpace(name.trim());
      showToast('Watch Space Created', name.trim(), 'success');
      setShowCreate(false);
      setName('');
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
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Watch Space
        </button>
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
            return (
              <div
                key={space.id}
                className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isActive
                    ? 'border-indigo-500/50 bg-indigo-950/15 shadow-lg shadow-indigo-950/30'
                    : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center flex-shrink-0 text-indigo-400">
                        <Tv className="w-4 h-4" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">{space.name}</h3>
                      {space.ownerId === profile?.id && (
                        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Member limit: {space.memberLimit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <Link
                    to="/"
                    onClick={() => setCurrentSpaceId(space.id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isActive ? 'Browsing as Active' : 'Select Space'}
                  </Link>
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
          <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Create Watch Space</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Family Watch Space"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
