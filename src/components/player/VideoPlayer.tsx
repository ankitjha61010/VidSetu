import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoMetadata, ZoomLevel } from '../../types';
import { VideoControls } from './VideoControls';
import { googleAuth } from '../../services/googleAuth';
import { Loader2, Play } from 'lucide-react';

interface VideoPlayerProps {
  video: VideoMetadata;
}

// Persistent device identifier (IP / PC local machine fingerprint)
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('vidsetu_device_id');
  if (!deviceId) {
    deviceId = 'pc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('vidsetu_device_id', deviceId);
  }
  return deviceId;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [mediaSrc, setMediaSrc] = useState<string>('');
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const deviceId = getDeviceId();
  const STORAGE_PLAYBACK_KEY = `vidsetu_playback_${deviceId}_${video.id}`;

  // Read saved timestamp synchronously on mount
  const initialSavedTime = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYBACK_KEY) || localStorage.getItem(`vidsetu_playback_${video.id}`);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  })();

  // 1. Fetch direct authorized video stream URL with timestamp offset
  useEffect(() => {
    let active = true;

    const setupStream = async () => {
      setIsBuffering(true);
      try {
        const token = await googleAuth.getValidAccessToken();
        if (active) {
          let streamUrl = `https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media&access_token=${encodeURIComponent(token)}`;
          if (initialSavedTime > 0) {
            streamUrl += `#t=${initialSavedTime}`;
          }
          setMediaSrc(streamUrl);
        }
      } catch (err) {
        console.warn('Stream fetch token fallback:', err);
        if (active) {
          const fallback = video.webContentLink || '';
          setMediaSrc(initialSavedTime > 0 ? `${fallback}#t=${initialSavedTime}` : fallback);
        }
      }
    };

    setupStream();

    return () => {
      active = false;
    };
  }, [video.driveFileId, video.webContentLink, initialSavedTime]);

  const hasResumedRef = useRef(false);

  // 2. Exact Timestamp Auto-Resume when video metadata or duration is ready
  const applyResumeTime = useCallback(() => {
    if (!videoRef.current || hasResumedRef.current) return;
    try {
      const saved = localStorage.getItem(STORAGE_PLAYBACK_KEY) || localStorage.getItem(`vidsetu_playback_${video.id}`);
      if (saved) {
        const time = parseFloat(saved);
        if (time > 0.5) {
          hasResumedRef.current = true;
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          const mins = Math.floor(time / 60);
          const secs = Math.floor(time % 60);
          setResumedNotice(`Resumed from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
          setTimeout(() => setResumedNotice(null), 4000);
        }
      }
    } catch (e) {
      console.warn('Failed to restore timestamp:', e);
    }
  }, [STORAGE_PLAYBACK_KEY, video.id]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsBuffering(false);
    applyResumeTime();
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
    applyResumeTime();
  };

  // 3. Track time on every second and save immediately to device storage
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    if (cur > 0.5) {
      localStorage.setItem(STORAGE_PLAYBACK_KEY, cur.toString());
      localStorage.setItem(`vidsetu_playback_${video.id}`, cur.toString());
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    }
  };

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn('Playback blocked:', err);
          setAutoplayBlocked(true);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    localStorage.setItem(STORAGE_PLAYBACK_KEY, time.toString());
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    videoRef.current.currentTime = newTime;
    localStorage.setItem(STORAGE_PLAYBACK_KEY, newTime.toString());
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, volume, isMuted, duration]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      className={`relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none group ${
        isFullscreen ? 'rounded-none border-none' : ''
      }`}
    >
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {useIframeFallback ? (
          <iframe
            src={`https://drive.google.com/file/d/${video.driveFileId}/preview`}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={video.name}
          />
        ) : (
          mediaSrc && (
            <video
              ref={videoRef}
              src={mediaSrc}
              playsInline
              preload="metadata"
              className="w-full h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.warn('Direct stream codec fallback to preview stream:', e);
                setUseIframeFallback(true);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setShowControls(true);
              }}
              onPlay={() => {
                applyResumeTime();
              }}
              onClick={handlePlayPause}
            />
          )
        )}
      </div>

      {/* Auto-Resume Notification */}
      {resumedNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-indigo-600/95 text-white text-xs sm:text-sm font-semibold backdrop-blur-md shadow-2xl border border-indigo-400/50 animate-fadeIn pointer-events-none flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{resumedNotice}</span>
        </div>
      )}

      {/* Native Controls Overlay */}
      {!useIframeFallback && (
        <>
          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none backdrop-blur-xs">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-white/90">Loading video...</span>
              </div>
            </div>
          )}

          {/* Autoplay blocked overlay */}
          {autoplayBlocked && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <button
                onClick={handlePlayPause}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-2xl shadow-indigo-600/50 transform hover:scale-105 transition-all"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>Click to Play Video</span>
              </button>
            </div>
          )}

          <VideoControls
            video={video}
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            currentTime={currentTime}
            duration={duration}
            isFullscreen={isFullscreen}
            zoom={zoom}
            showControls={showControls}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onToggleFullscreen={handleToggleFullscreen}
            onTogglePiP={handleTogglePiP}
            onZoomChange={setZoom}
            onSkip={handleSkip}
          />
        </>
      )}
    </div>
  );
};
