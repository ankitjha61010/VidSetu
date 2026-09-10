import React, { useState } from 'react';
import { Sparkles, Info } from 'lucide-react';
import { PlaybackSource } from '../../types';

interface VideoPlayerProps {
  source: PlaybackSource;
  title: string;
}

// Renders whatever PlaybackSource the PlaybackResolver hands back (iframe today,
// could be a native <video> for a future provider) inside the same visual chrome.
// The rest of the app never needs to know which playback provider produced it.
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, title }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full space-y-2 select-none">
      <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
        {!loaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Connecting to Player...</span>
            </div>
          </div>
        )}

        {source.type === 'iframe' ? (
          <iframe
            src={source.url}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            title={title}
          />
        ) : (
          <video
            src={source.url}
            className="w-full h-full"
            controls
            autoPlay
            onLoadedData={() => setLoaded(true)}
          />
        )}
      </div>

      {source.isTrailer && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Playing the official trailer. Full playback via a licensed provider is coming soon.</span>
        </div>
      )}
    </div>
  );
};
