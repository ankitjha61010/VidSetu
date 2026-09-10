import React, { useState, useEffect } from 'react';
import { Sparkles, Info, Server, Film } from 'lucide-react';
import { PlaybackSource } from '../../types';

interface VideoPlayerProps {
  source: PlaybackSource;
  title: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, title }) => {
  const [loaded, setLoaded] = useState(false);
  const [activeUrl, setActiveUrl] = useState(source.url);

  useEffect(() => {
    setActiveUrl(source.url);
    setLoaded(false);
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, [source.url]);

  const handleServerChange = (url: string) => {
    if (url === activeUrl) return;
    setLoaded(false);
    setActiveUrl(url);
  };

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
        {!loaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-0 pointer-events-none">
            <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Loading Stream Player...</span>
            </div>
          </div>
        )}

        {source.type === 'iframe' ? (
          <iframe
            key={activeUrl}
            src={activeUrl}
            className="absolute inset-0 w-full h-full border-0 z-10 pointer-events-auto"
            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; web-share *; accelerometer *; gyroscope *"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            title={title}
            style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' }}
          />
        ) : (
          <video
            key={activeUrl}
            src={activeUrl}
            className="w-full h-full"
            controls
            autoPlay
            onLoadedData={() => setLoaded(true)}
          />
        )}
      </div>

      {source.servers && source.servers.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-400" />
              Streaming Servers
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              Full Feature Length (1080p/720p HD)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            {source.servers.map((server, idx) => (
              <button
                key={idx}
                onClick={() => handleServerChange(server.url)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeUrl === server.url
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {server.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {source.isTrailer ? (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Playing official trailer preview.</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
          <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Playing full feature stream. To change audio language (Hindi / Dual Audio) or subtitles, use the Audio/CC icon in player controls or switch servers above.</span>
        </div>
      )}
    </div>
  );
};
