import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plyr, PlyrInstance, PlyrProps } from 'plyr-react';
import 'plyr-react/plyr.css';
import { VideoMetadata } from '../../types';
import { googleAuth } from '../../services/googleAuth';
import {
  Film,
  ExternalLink,
  RotateCcw,
  Layers,
} from 'lucide-react';

interface VideoPlayerProps {
  video: VideoMetadata;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const plyrRef = useRef<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [useEmbedMode, setUseEmbedMode] = useState<boolean>(false);
  const [resumedTime, setResumedTime] = useState<number | null>(null);

  const STORAGE_KEY = `vidsetu_ply_time_${video.id}`;

  // 1. Build stream sources
  useEffect(() => {
    let active = true;

    const resolveStreamUrl = async () => {
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

    resolveStreamUrl();
    return () => {
      active = false;
    };
  }, [video.driveFileId]);

  // Read saved timestamp
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const t = parseFloat(saved);
        if (t > 1) {
          setResumedTime(t);
        }
      }
    } catch {}
  }, [STORAGE_KEY]);

  // Plyr Source Specification
  const plyrSource: PlyrProps['source'] = useMemo(() => {
    const poster = video.thumbnailLink ? video.thumbnailLink.replace(/=s\d+/, '=s1280') : undefined;
    const mediaType = video.mimeType && video.mimeType.startsWith('video/') ? video.mimeType : 'video/mp4';

    return {
      type: 'video',
      title: video.originalFileName || video.name,
      sources: [
        {
          src: streamUrl,
          type: mediaType,
          size: 1080,
        },
      ],
      poster,
    };
  }, [streamUrl, video]);

  // Plyr Options
  const plyrOptions: PlyrProps['options'] = useMemo(
    () => ({
      controls: [
        'play-large',
        'restart',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['speed', 'quality', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      seekTime: 10,
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      fullscreen: { enabled: true, fallback: true, iosNative: true },
      ratio: '16:9',
      storage: { enabled: true, key: `vidsetu_plyr_pref` },
      clickToPlay: true,
      hideControls: true,
      resetOnEnd: false,
    }),
    []
  );

  // Auto-restore time and save current playback time
  const handleTimeUpdate = (instance: PlyrInstance) => {
    if (!instance) return;
    const cur = instance.currentTime;
    if (cur > 1) {
      localStorage.setItem(STORAGE_KEY, cur.toString());
    }
  };

  const handleLoadedData = (instance: PlyrInstance) => {
    if (!instance) return;
    if (resumedTime && resumedTime > 1) {
      try {
        instance.currentTime = resumedTime;
      } catch {}
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Player Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
            {video.originalFileName || video.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resumedTime && resumedTime > 1 && (
            <button
              onClick={() => {
                if (plyrRef.current && (plyrRef.current as any).plyr) {
                  (plyrRef.current as any).plyr.currentTime = resumedTime;
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resume ({Math.floor(resumedTime / 60)}:{Math.floor(resumedTime % 60).toString().padStart(2, '0')})</span>
            </button>
          )}

          <button
            onClick={() => setUseEmbedMode(!useEmbedMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all ${
              useEmbedMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Switch between Modern Stream Player and Google Drive Embed"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{useEmbedMode ? 'Using Google Player' : 'Using Modern Player'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Box */}
      <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 group">
        {useEmbedMode ? (
          <iframe
            src={`https://drive.google.com/file/d/${video.driveFileId}/preview`}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.name}
          />
        ) : (
          streamUrl && (
            <Plyr
              ref={plyrRef}
              source={plyrSource}
              options={plyrOptions}
              onTimeUpdate={(e: any) => handleTimeUpdate(e.detail?.plyr)}
              onLoadedData={(e: any) => handleLoadedData(e.detail?.plyr)}
            />
          )
        )}
      </div>

      {/* Quick Player Shortcuts & Tips */}
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
