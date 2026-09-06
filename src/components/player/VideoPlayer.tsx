import React, { useState, useEffect } from 'react';
import { VideoMetadata } from '../../types';

interface VideoPlayerProps {
  video: VideoMetadata;
}

// Helper to get or generate persistent device identifier
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('vidsetu_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('vidsetu_device_id', deviceId);
  }
  return deviceId;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);
  const deviceId = getDeviceId();
  const STORAGE_PLAYBACK_KEY = `vidsetu_playback_${deviceId}_${video.id}`;

  // Read saved timestamp and construct streaming URL
  const savedTimestamp = parseFloat(localStorage.getItem(STORAGE_PLAYBACK_KEY) || '0');

  useEffect(() => {
    if (savedTimestamp > 10) {
      const mins = Math.floor(savedTimestamp / 60);
      const secs = Math.floor(savedTimestamp % 60);
      setResumedNotice(`Resuming playback from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
      const timer = setTimeout(() => setResumedNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [savedTimestamp]);

  // Listen for periodic watch time updates and record timestamp for this device
  useEffect(() => {
    const handleStorageWatch = (event: MessageEvent) => {
      try {
        if (event.data && typeof event.data === 'string') {
          const parsed = JSON.parse(event.data);
          if (parsed.currentTime && parsed.currentTime > 5) {
            localStorage.setItem(STORAGE_PLAYBACK_KEY, parsed.currentTime.toString());
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleStorageWatch);
    return () => window.removeEventListener('message', handleStorageWatch);
  }, [STORAGE_PLAYBACK_KEY]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none group">
      {/* High-speed Google Drive streaming player */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <iframe
          src={`https://drive.google.com/file/d/${video.driveFileId}/preview`}
          className="w-full h-full border-none"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title={video.originalFileName || video.name}
        />
      </div>

      {/* Auto-Resume Notification Banner */}
      {resumedNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-indigo-600/95 text-white text-xs sm:text-sm font-semibold backdrop-blur-md shadow-2xl border border-indigo-400/50 animate-fadeIn pointer-events-none flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{resumedNotice}</span>
        </div>
      )}
    </div>
  );
};
