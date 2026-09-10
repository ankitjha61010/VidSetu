import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Episode, Season } from '../../types';

interface SeasonEpisodeSelectorProps {
  seriesId: number;
  seasons: Season[];
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  episodes: Episode[];
  isLoadingEpisodes?: boolean;
}

export const SeasonEpisodeSelector: React.FC<SeasonEpisodeSelectorProps> = ({
  seriesId,
  seasons,
  selectedSeason,
  onSelectSeason,
  episodes,
  isLoadingEpisodes,
}) => {
  if (seasons.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white">Episodes</h2>
        <select
          value={selectedSeason}
          onChange={(e) => onSelectSeason(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
        >
          {seasons.map((s) => (
            <option key={s.seasonNumber} value={s.seasonNumber}>
              {s.name || `Season ${s.seasonNumber}`}
            </option>
          ))}
        </select>
      </div>

      {isLoadingEpisodes ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-sm text-slate-500">No episode data available for this season.</p>
      ) : (
        <div className="space-y-2">
          {episodes.map((ep) => (
            <Link
              key={ep.episodeNumber}
              to={`/watch/tv/${seriesId}/${ep.seasonNumber}/${ep.episodeNumber}`}
              className="flex gap-3 p-3 rounded-2xl glass-panel-interactive"
            >
              <div className="relative flex-shrink-0 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-900">
                {ep.stillUrl ? (
                  <img src={ep.stillUrl} alt={ep.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Play className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-indigo-300">
                  {ep.seasonNumber}x{String(ep.episodeNumber).padStart(2, '0')}
                </p>
                <h3 className="text-sm font-bold text-white truncate">{ep.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ep.overview || 'No description available.'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
