import React, { useState, useEffect } from 'react';
import { Sparkles, Info, Server, Film, Languages, Volume2, CheckCircle2 } from 'lucide-react';
import { PlaybackServer, PlaybackSource } from '../../types';

interface VideoPlayerProps {
  source: PlaybackSource;
  title: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, title }) => {
  const [loaded, setLoaded] = useState(false);
  const [audioLang, setAudioLang] = useState<'hi' | 'en'>('hi'); // Default to Hindi Audio for Indian users!
  const [activeUrl, setActiveUrl] = useState('');
  const [showHindiGuide, setShowHindiGuide] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState('');

  // Derive current server list based on selected audio language
  const currentServers: PlaybackServer[] = React.useMemo(() => {
    if (audioLang === 'hi' && source.hindiServers && source.hindiServers.length > 0) {
      return source.hindiServers;
    }
    return source.servers || [];
  }, [audioLang, source]);

  useEffect(() => {
    // When audio lang or source changes, pick the first server in that language list
    const servers = audioLang === 'hi' && source.hindiServers && source.hindiServers.length > 0
      ? source.hindiServers
      : source.servers || [];

    const defaultUrl = servers.length > 0 ? servers[0].url : source.url;
    setActiveUrl(defaultUrl);
    setLoaded(false);
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, [audioLang, source]);

  const handleServerChange = (url: string) => {
    if (url === activeUrl) return;
    setLoaded(false);
    setActiveUrl(url);
  };

  const handleLanguageChange = (lang: 'hi' | 'en') => {
    if (lang === audioLang) return;
    setAudioLang(lang);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    setLoaded(false);
    setActiveUrl(customInputUrl.trim());
  };

  return (
    <div className="w-full space-y-3">
      {/* Audio Language Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">Audio / Dubbed Language:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLanguageChange('hi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${audioLang === 'hi'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
          >
            <span>🇮🇳 Hindi Dubbed / Dual Audio</span>
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${audioLang === 'en'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
          >
            <span>🇺🇸 English (Original)</span>
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80">
        {!loaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-0 pointer-events-none">
            <div className="w-10 h-10 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Loading {audioLang === 'hi' ? 'Hindi Dubbed Stream' : 'Stream Player'}...</span>
            </div>
          </div>
        )}

        {source.type === 'iframe' ? (
          <iframe
            key={activeUrl}
            src={activeUrl}
            className="absolute inset-0 w-full h-full border-0 z-10 pointer-events-auto"
            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; web-share *; accelerometer *; gyroscope *"
            referrerPolicy="no-referrer"
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

      {/* Streaming Server Selector */}
      {currentServers.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-400" />
              {audioLang === 'hi' ? 'Hindi / Dual Audio Servers' : 'English Streaming Servers'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1 transition-colors"
              >
                <span>➕ Custom Server URL</span>
              </button>
              <button
                onClick={() => setShowHindiGuide(!showHindiGuide)}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 transition-colors"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Audio Help</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                Full HD (1080p/720p)
              </span>
            </div>
          </div>

          {showCustomInput && (
            <form onSubmit={handleApplyCustomUrl} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="url"
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                placeholder="Paste any custom Hindi stream or iframe URL (e.g. https://...)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
              >
                Play Stream
              </button>
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            {currentServers.map((server, idx) => (
              <button
                key={idx}
                onClick={() => handleServerChange(server.url)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeUrl === server.url
                    ? audioLang === 'hi'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                      : 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
              >
                {audioLang === 'hi' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Hindi Dubbed / Dual Audio" />
                )}
                {server.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Hindi Audio Guide Toggle Banner */}
      {showHindiGuide && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
              <Languages className="w-4 h-4 text-amber-400" />
              Hindi Audio & Dual Audio Tips
            </h4>
            <button
              onClick={() => setShowHindiGuide(false)}
              className="text-amber-400 hover:text-white text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                1. Tap 'Hindi Dubbed' Tab
              </div>
              <p className="text-slate-300">
                Make sure the <strong>🇮🇳 Hindi Dubbed / Dual Audio</strong> tab above is selected.
              </p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                2. Server 1 (VidSrc PM) & Server 2
              </div>
              <p className="text-slate-300">
                <strong>Server 1 (VidSrc PM)</strong> loads HDHub4u Dual Audio prints. <strong>Server 2 (MultiEmbed)</strong> provides dedicated Hindi audio!
              </p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                3. Player Audio Selector
              </div>
              <p className="text-slate-300">
                If playing Dual Audio print, click 🔊 / ⚙️ inside player to switch Audio track to <strong>Hindi</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {source.isTrailer ? (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Playing official trailer preview.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Quick Hindi Options Bar */}
          {audioLang === 'hi' && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-amber-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-amber-400" />
                  3 Ways to Watch "{title}" in Hindi Audio:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' hindi dubbed full movie')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-amber-500/20 flex flex-col gap-1 transition-colors group"
                >
                  <span className="font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                    1. YouTube Hindi ↗
                  </span>
                  <span className="text-slate-400 text-[10px]">Watch Hindi clips & full releases on YouTube</span>
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(title + ' watch online disney hotstar netflix jiocinema hindi')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-amber-500/20 flex flex-col gap-1 transition-colors group"
                >
                  <span className="font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                    2. OTT (Hotstar/Jio) ↗
                  </span>
                  <span className="text-slate-400 text-[10px]">Watch official Hindi dub on Hotstar/JioCinema</span>
                </a>

                <button
                  onClick={() => setShowCustomInput(true)}
                  className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-amber-500/20 flex flex-col gap-1 text-left transition-colors group"
                >
                  <span className="font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                    3. Custom Stream Link ➕
                  </span>
                  <span className="text-slate-400 text-[10px]">Paste your own Hindi video/iframe link above</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 px-3 py-3 bg-slate-900/60 rounded-2xl border border-slate-800/80">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-slate-300 font-medium">
                  Playing in <strong>{audioLang === 'hi' ? 'Hindi Dubbed / Dual Audio' : 'English Original'}</strong> mode.
                </p>
                <p className="text-slate-400 text-[10px]">
                  🇮🇳 <strong>Bollywood & Indian Titles:</strong> Play 100% in Hindi Audio across all servers.
                  <span className="mx-1">•</span>
                  🎬 <strong>Hollywood Titles:</strong> Free public embed APIs scrape original English audio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

