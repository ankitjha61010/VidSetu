import React from 'react';
import { VideoList } from '../components/library/VideoList';

export const VideosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Movies & Videos Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Displaying all movie and video files stored inside the <strong className="text-indigo-300">VidSetu_Videos</strong> folder
          </p>
        </div>
      </div>

      <VideoList />
    </div>
  );
};
