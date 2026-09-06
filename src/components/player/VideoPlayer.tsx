import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoMetadata } from '../../types';
import { googleAuth } from '../../services/googleAuth';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture,
  Layers,
  Settings,
  Check,
  AlertCircle,
  Film,
  ExternalLink,
} from 'lucide-react';

interface VideoPlayerProps {
  video: VideoMetadata;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<any>(null);

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [useEmbedMode, setUseEmbedMode] = useState<boolean>(false);
  const [resumedTime, setResumedTime] = useState<number | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  const STORAGE_KEY = `vidsetu_ply_time_${video.id}`;

  // 1. Resolve stream URL
  useEffect(() => {
    let active = true;

    const resolveStream = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        let token = '';
        if (googleAuth.isAuthenticated()) {
          token = await googleAuth.getValidAccessToken();
        }

        if (active) {
          if (token) {
            setStreamUrl(
              `https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media&access_token=${encodeURIComponent(token)}`
            );
          } else {
            setStreamUrl(`https://drive.google.com/uc?export=download&id=${video.driveFileId}&confirm=t`);
          }
        }
      } catch {
        if (active) {
          setStreamUrl(`https://drive.google.com/uc?export=download&id=${video.driveFileId}&confirm=t`);
        }
      }
    };

    resolveStream();
    return () => {
      active = false;
    };
  }, [video.driveFileId]);

  // 2. Saved timestamp resume
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

  // Controls Visibility Auto-hide
  const triggerShowControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        if (!showSettings) {
          setShowControls(false);
        }
      }, 3000);
    }
  }, [isPlaying, showSettings]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    } else {
      triggerShowControls();
    }
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isPlaying, triggerShowControls]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(() => {
        // Fallback or user interaction required
      });
    } else {
      videoRef.current.pause();
    }
  }, []);

  // Skip forward / backward
  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.min(Math.max(0, videoRef.current.currentTime + seconds), videoRef.current.duration || 0);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    triggerShowControls();
  }, [triggerShowControls]);

  // Volume & Mute
  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
    if (!newMute && volume === 0) {
      handleVolumeChange(0.5);
    }
  };

  // Speed
  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Picture in picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

  // Seek bar handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSkip, toggleFullscreen, toggleMute]);

  // Time formatter
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  // Resume saved time
  const handleResume = () => {
    if (videoRef.current && resumedTime) {
      videoRef.current.currentTime = resumedTime;
      setCurrentTime(resumedTime);
      videoRef.current.play().catch(() => {});
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const poster = video.thumbnailLink ? video.thumbnailLink.replace(/=s\d+/, '=s1280') : undefined;

  return (
    <div className="w-full space-y-3 select-none">
      {/* Top Player Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
            {video.originalFileName || video.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resumedTime && resumedTime > 2 && (
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resume ({formatTime(resumedTime)})</span>
            </button>
          )}

          <button
            onClick={() => setUseEmbedMode(!useEmbedMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all ${
              useEmbedMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Switch player engine"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{useEmbedMode ? 'Google Stream Engine' : 'Modern VidSetu Engine'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Box Container */}
      <div
        ref={containerRef}
        onMouseMove={triggerShowControls}
        onTouchStart={triggerShowControls}
        className={`relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-full w-full' : ''
        }`}
      >
        {useEmbedMode ? (
          <iframe
            src={`https://drive.google.com/file/d/${video.driveFileId}/preview`}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.name}
          />
        ) : (
          <>
            {/* Native HTML5 Video Stream */}
            <video
              ref={videoRef}
              src={streamUrl}
              poster={poster}
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onLoadedData={() => {
                setIsLoading(false);
                setHasError(false);
                if (resumedTime && resumedTime > 2 && videoRef.current) {
                  videoRef.current.currentTime = resumedTime;
                }
              }}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const curr = videoRef.current.currentTime;
                  setCurrentTime(curr);
                  if (curr > 1) {
                    localStorage.setItem(STORAGE_KEY, curr.toString());
                  }
                }
              }}
              onDurationChange={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onError={() => {
                // If HTML5 stream direct play throws CORS or auth error, auto-fallback gracefully
                setIsLoading(false);
                setHasError(true);
              }}
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Error / CORS Fallback Overlay */}
            {hasError && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                <h4 className="text-base font-bold text-white mb-1">Direct Stream Notice</h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-4">
                  Google Drive large video streaming security is active. Switch to the high-speed Google Engine to watch without interruption.
                </p>
                <button
                  onClick={() => {
                    setUseEmbedMode(true);
                    setHasError(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Switch to Google Stream Engine</span>
                </button>
              </div>
            )}

            {/* Center Big Play / Loading Action Button */}
            {!hasError && (
              <div
                className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {isLoading ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center shadow-2xl">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 sm:gap-8 pointer-events-auto">
                    {/* Rewind 10s */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip(-10);
                      }}
                      className="p-3 sm:p-4 rounded-full bg-black/60 hover:bg-indigo-600/80 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all active:scale-90"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Central Play/Pause */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/60 border border-indigo-400/30 transform hover:scale-105 active:scale-95 transition-all"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                      ) : (
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                      )}
                    </button>

                    {/* Fast Forward 10s */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip(10);
                      }}
                      className="p-3 sm:p-4 rounded-full bg-black/60 hover:bg-indigo-600/80 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all active:scale-90"
                      title="Forward 10s"
                    >
                      <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Control Bar */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-5 pt-8 space-y-2.5 transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Scrubbing Progress Bar */}
              <div
                ref={progressBarRef}
                onClick={handleSeek}
                onTouchStart={handleSeek}
                onTouchMove={handleSeek}
                className="relative w-full h-2 hover:h-3 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all duration-150 group/bar flex items-center touch-none"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg ring-2 ring-indigo-500 scale-0 group-hover/bar:scale-100 transition-transform" />
                </div>
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center justify-between gap-2 text-white">
                {/* Left Side: Play, Skip, Volume, Timestamp */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 sm:p-2 text-white hover:text-indigo-400 hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => handleSkip(-10)}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => handleSkip(10)}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                    title="Forward 10s"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1 group/vol ml-1">
                    <button
                      onClick={toggleMute}
                      className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="hidden sm:inline-block w-16 sm:w-20 h-1.5 bg-slate-700 accent-indigo-500 rounded-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                      aria-label="Volume slider"
                    />
                  </div>

                  {/* Time Counters */}
                  <div className="text-[11px] sm:text-xs font-mono text-slate-300 ml-2 whitespace-nowrap">
                    <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right Side: Speed Settings, PiP, Fullscreen */}
                <div className="flex items-center gap-1 sm:gap-1.5 relative">
                  {/* Speed Popover Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      title="Playback Speed"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-[11px]">{playbackSpeed}x</span>
                    </button>

                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 w-36 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-40 space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          Playback Speed
                        </div>
                        {SPEED_OPTIONS.map((speed) => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              playbackSpeed === speed
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{speed === 1 ? 'Normal (1x)' : `${speed}x`}</span>
                            {playbackSpeed === speed && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Picture-in-Picture */}
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={togglePiP}
                      className="hidden sm:inline-flex p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      title="Picture in Picture"
                    >
                      <PictureInPicture className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Shortcuts & Tips */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 px-2 py-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Space</kbd> Play / Pause
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">F</kbd> Fullscreen
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">M</kbd> Mute
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">← / →</kbd> ±10s
          </span>
        </div>

        <a
          href={`https://drive.google.com/file/d/${video.driveFileId}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Open in Google Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
