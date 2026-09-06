import React from 'react';
import { Clock, ArrowLeft, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExpiredVideoProps {
  videoTitle?: string;
  expiredAt?: number;
}

export const ExpiredVideo: React.FC<ExpiredVideoProps> = ({ videoTitle, expiredAt }) => {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 glass-card rounded-3xl border border-rose-500/20 text-center shadow-2xl animate-fadeIn relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-400">
        <Clock className="w-10 h-10" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3 uppercase tracking-wider">
        5-Hour Lifespan Reached
      </span>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
        This video has expired.
      </h2>

      <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
        {videoTitle ? (
          <>
            The watch period for <strong className="text-white font-semibold">"{videoTitle}"</strong> has ended.
          </>
        ) : (
          'This video sharing session has ended.'
        )}{' '}
        Per VidSetu's privacy policy, temporary playback, downloads, and links are disabled after 5 hours.
      </p>

      {expiredAt && (
        <p className="text-xs font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 max-w-xs mx-auto mb-8">
          Expired on: {new Date(expiredAt).toLocaleString()}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/videos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 text-sm transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Video</span>
        </Link>
      </div>
    </div>
  );
};
