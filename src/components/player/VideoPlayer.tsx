import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoMetadata, ZoomLevel } from '../../types';
import { VideoControls } from './VideoControls';
import { googleAuth } from '../../services/googleAuth';
import { Loader2, Play, Maximize, Minimize } from 'lucide-react';

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

  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{ side: 'left' | 'right'; show: boolean }>({ side: 'left', show: false });
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleFullscreen = () => {
    const container = playerContainerRef.current;
    const videoEl = videoRef.current as any;
    if (!container) return;

    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      isPseudoFullscreen
    );

    if (!isCurrentlyFullscreen) {
      // 1. Try standard / container fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          // iOS Safari fallback
          if (videoEl?.webkitEnterFullscreen) {
            videoEl.webkitEnterFullscreen();
            setIsFullscreen(true);
          } else {
            setIsPseudoFullscreen(true);
            setIsFullscreen(true);
          }
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
        setIsFullscreen(true);
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
        setIsFullscreen(true);
      } else if (videoEl?.webkitEnterFullscreen) {
        // iOS Safari native fullscreen
        videoEl.webkitEnterFullscreen();
        setIsFullscreen(true);
      } else {
        // Pseudo Fullscreen fallback for mobile browsers
        setIsPseudoFullscreen(true);
        setIsFullscreen(true);
      }

      // Try orientation lock on mobile
      try {
        if ((window.screen as any)?.orientation?.lock) {
          (window.screen as any).orientation.lock('landscape').catch(() => {});
        }
      } catch {}
    } else {
      if (isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);

      try {
        if ((window.screen as any)?.orientation?.unlock) {
          (window.screen as any).orientation.unlock();
        }
      } catch {}
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
    setCurrentTime(newTime);
    localStorage.setItem(STORAGE_PLAYBACK_KEY, newTime.toString());
  };

  // Mobile Touch / Double Tap handling
  const handleVideoTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    if (!touch || !playerContainerRef.current) return;

    const rect = playerContainerRef.current.getBoundingClientRect();
    const tapX = touch.clientX - rect.left;
    const width = rect.width;

    const timeDiff = now - lastTapRef.current.time;
    const isDoubleTap = timeDiff < 300 && Math.abs(touch.clientX - lastTapRef.current.x) < 50;

    if (isDoubleTap) {
      // Double tap detected: Left 40% = -10s, Right 40% = +10s
      if (tapX < width * 0.4) {
        handleSkip(-10);
        showDoubleTapFeedback('left');
      } else if (tapX > width * 0.6) {
        handleSkip(10);
        showDoubleTapFeedback('right');
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: touch.clientX };
      // Toggle controls on single tap
      setShowControls((prev) => !prev);
    }
  };

  const showDoubleTapFeedback = (side: 'left' | 'right') => {
    setDoubleTapFeedback({ side, show: true });
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setDoubleTapFeedback({ side: 'left', show: false });
    }, 700);
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

  // Fullscreen event listener (cross-browser and iOS)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement ||
        isPseudoFullscreen
      );
      setIsFullscreen(isFs);
    };

    const videoEl = videoRef.current;
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', () => setIsFullscreen(true));
      videoEl.addEventListener('webkitendfullscreen', () => setIsFullscreen(false));
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isPseudoFullscreen]);

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleVideoTouch}
      className={`relative w-full aspect-video bg-black overflow-hidden shadow-2xl select-none group touch-manipulation ${
        isPseudoFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none max-h-screen'
          : isFullscreen
          ? 'w-full h-full rounded-none border-none'
          : 'rounded-2xl sm:rounded-3xl border border-slate-800'
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
              webkit-playsinline="true"
              x5-playsinline="true"
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
            />
          )
        )}
      </div>

      {/* Double Tap Ripple Indicator */}
      {doubleTapFeedback.show && (
        <div
          className={`absolute top-0 bottom-0 w-1/3 flex items-center justify-center pointer-events-none z-40 bg-white/10 animate-pulse ${
            doubleTapFeedback.side === 'left' ? 'left-0 rounded-r-full' : 'right-0 rounded-l-full'
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md">
            <span>{doubleTapFeedback.side === 'left' ? '⏪ -10s' : '⏩ +10s'}</span>
          </div>
        </div>
      )}

      {/* Auto-Resume Notification */}
      {resumedNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-indigo-600/95 text-white text-xs sm:text-sm font-semibold backdrop-blur-md shadow-2xl border border-indigo-400/50 animate-fadeIn pointer-events-none flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{resumedNotice}</span>
        </div>
      )}

      {/* Floating Action Overlay for Iframe & Native Playback */}
      {useIframeFallback && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-indigo-600 text-white text-xs font-semibold backdrop-blur-md border border-slate-700/80 shadow-2xl transition-all active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-indigo-400" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
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
