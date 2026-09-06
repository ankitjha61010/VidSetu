import React from 'react';
import { useAuth } from '../context/AuthContext';
import { VideoList } from '../components/library/VideoList';
import { Film, LogIn } from 'lucide-react';

export const VideosPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-card rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <Film className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Sign In to Access Movies Library</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Connect your Google account to browse, stream, and watch movies stored in your library.
          </p>
        </div>
        <button
          onClick={() => login()}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all text-sm"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Movies & Videos Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Displaying all movie and video files stored inside your <strong className="text-indigo-300">VidSetu_Videos</strong> folder
          </p>
        </div>
      </div>

      <VideoList />
    </div>
  );
};
