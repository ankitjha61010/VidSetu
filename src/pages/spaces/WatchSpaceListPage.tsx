import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Crown, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWatchSpace } from '../../context/WatchSpaceContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const WatchSpaceListPage: React.FC = () => {
  const { profile } = useAuth();
  const { spaces, isLoading, createWatchSpace, setCurrentSpaceId } = useWatchSpace();
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Watch Spaces</h1>
          <p className="text-sm text-slate-400 mt-1">Signed in as {profile?.name || profile?.email}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spaces.map((space) => (
            <Link
              key={space.id}
              to="/"
              onClick={() => setCurrentSpaceId(space.id)}
              className="glass-panel-interactive p-5 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white truncate">{space.name}</h3>
                {space.ownerId === profile?.id && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                Member limit: {space.memberLimit}
              </div>
              <Link
                to={`/spaces/${space.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Manage →
              </Link>
            </Link>
          ))}
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
