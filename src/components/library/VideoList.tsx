import React from 'react';
import { useDrive } from '../../context/DriveContext';
import { VideoCard } from './VideoCard';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { RefreshCw, Trash2, Film } from 'lucide-react';

export const VideoList: React.FC = () => {
  const {
    videos,
    isLoading,
    isPurging,
    error,
    fetchVideos,
    loadMoreVideos,
    nextPageToken,
    deleteVideo,
    purgeExpired,
  } = useDrive();

  if (isLoading && videos.length === 0) {
    return (
      <div className="py-20">
        <LoadingState
          message="Fetching Videos from Google Drive..."
          subMessage="Reading folder contents and expiration metadata"
        />
      </div>
    );
  }

  if (error && videos.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchVideos(true)} />;
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        title="No Movies Found in 'VidSetu_Videos'"
        description="Place any movie file (.mp4, .mkv, .mov, .avi) directly inside your Google Drive 'VidSetu_Videos' folder and click Refresh."
        onAction={() => fetchVideos(true)}
        actionText="Refresh Library"
      />
    );
  }

  const expiredCount = videos.filter((v) => v.isExpired || (v.expiresAt && Date.now() > v.expiresAt)).length;

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Film className="w-4 h-4 text-indigo-400" />
          <span>
            Showing <strong className="text-white">{videos.length}</strong> videos in{' '}
            <strong className="text-indigo-300">VidSetu_Videos</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {expiredCount > 0 && (
            <button
              onClick={() => purgeExpired()}
              disabled={isPurging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
              title="Clean up all expired videos from Google Drive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPurging ? 'Purging...' : `Clean ${expiredCount} Expired`}</span>
            </button>
          )}

          <button
            onClick={() => fetchVideos(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onDelete={deleteVideo} />
        ))}
      </div>

      {/* Pagination / Load More */}
      {nextPageToken && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMoreVideos}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 hover:border-slate-600 transition-all shadow-lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading more...</span>
              </>
            ) : (
              <span>Load More Videos</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
