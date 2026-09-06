import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoMetadata, ZoomLevel } from '../../types';
import { VideoControls } from './VideoControls';
import { googleAuth } from '../../services/googleAuth';
import { Loader2, Play } from 'lucide-react';

interface VideoPlayerProps {
  video: VideoMetadata;
}

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

  const STORAGE_PLAYBACK_KEY = `vidsetu_playback_${video.id}`;

  // Prepare authenticated streaming media URL or direct stream
  useEffect(() => {
    let active = true;

    const setupStream = async () => {
      try {
        const token = await googleAuth.getValidAccessToken();
        if (active) {
          // Point directly to Google Drive stream endpoint with auth token query / header fallback
          // or direct webContentLink for instant buffer playback
          const streamUrl = `https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media&access_token=${encodeURIComponent(token)}`;
          setMediaSrc(streamUrl);
        }
      } catch (err) {
        console.warn('Direct stream fetch fallback:', err);
        if (active) {
          setMediaSrc(video.webContentLink || '');
        }
      }
    };

    setupStream();

    return () => {
      active = false;
    };
  }, [video.driveFileId, video.webContentLink]);

  // Restore playback timestamp on metadata loaded
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    setIsBuffering(false);

    try {
      const savedTime = localStorage.getItem(STORAGE_PLAYBACK_KEY);
      if (savedTime) {
        const time = parseFloat(savedTime);
        // Only restore if user had watched more than 5s and didn't finish
        if (time > 5 && time < dur - 10) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          const mins = Math.floor(time / 60);
          const secs = Math.floor(time % 60);
          setResumedNotice(`Resumed from ${mins}:${secs < 10 ? '0' : ''}${secs}`);
          setTimeout(() => setResumedNotice(null), 4000);
        }
      }
    } catch {}
  };

  // Auto-save playback position every 2 seconds
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    if (cur > 3) {
      localStorage.setItem(STORAGE_PLAYBACK_KEY, cur.toString());
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls visibility auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
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
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting input fields
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
          handleSkip(5);
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-5);
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

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      className={`relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none group ${
        isFullscreen ? 'rounded-none border-none' : ''
      }`}
    >
      {/* Video element with transform zoom centering */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {mediaSrc && (
          <video
            ref={videoRef}
            src={mediaSrc}
            playsInline
            className="w-full h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setShowControls(true);
              localStorage.removeItem(STORAGE_PLAYBACK_KEY);
            }}
            onClick={handlePlayPause}
          />
        )}
      </div>

      {/* Resume notification banner */}
      {resumedNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-indigo-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-2xl border border-indigo-400/40 animate-fadeIn pointer-events-none flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span>{resumedNotice}</span>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <span className="text-xs font-semibold text-white/90">Loading Stream...</span>
          </div>
        </div>
      )}

      {/* Prominent Play Button if browser blocked autoplay */}
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

      {/* Custom Player Controls */}
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
    </div>
  );
};
