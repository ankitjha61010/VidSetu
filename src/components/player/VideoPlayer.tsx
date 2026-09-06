import React, { useState, useEffect } from 'react';
import { VideoMetadata } from '../../types';
import {
  Film,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface VideoPlayerProps {
  video: VideoMetadata;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [resumedTime, setResumedTime] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const STORAGE_KEY = `vidsetu_ply_time_${video.id}`;

  // Read saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const t = parseFloat(saved);
        if (t > 2) {
          setResumedTime(t);
        }
      }
    } catch {}
  }, [STORAGE_KEY]);

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const drivePreviewUrl = `https://drive.google.com/file/d/${video.driveFileId}/preview`;
  const driveDirectViewUrl = `https://drive.google.com/file/d/${video.driveFileId}/view`;

  return (
    <div className="w-full space-y-3 select-none">
      {/* Top Player Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white truncate max-w-[220px] sm:max-w-md">
            {video.originalFileName || video.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resumedTime && resumedTime > 2 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px]">
              <RotateCcw className="w-3 h-3" />
              <span>Last watched at {formatTime(resumedTime)}</span>
            </div>
          )}

          <a
            href={driveDirectViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
            title="Open in full Google Drive viewer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Drive Viewer</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Video Box Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/90 group">
        {/* Loading shimmer before iframe loads */}
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Connecting to High-Speed Video Server...</span>
            </div>
          </div>
        )}

        {/* High-Performance Google Video Player with full controls, speed, subtitles, seeking & fullscreen */}
        <iframe
          src={drivePreviewUrl}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
          title={video.originalFileName || video.name}
        />
      </div>

      {/* Quick Player Shortcuts & Open in Drive */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 px-2 py-0.5">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>High-Speed Direct Stream Ready</span>
        </div>

        <a
          href={driveDirectViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <span>Open Full Quality in Google Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
