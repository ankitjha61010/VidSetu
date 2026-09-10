import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Tv } from 'lucide-react';
import { MediaItem } from '../../types';

interface MediaCardProps {
  item: MediaItem;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, className = 'w-[130px] sm:w-44' }) => {
  const href = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined;

  return (
    <Link
      to={href}
      className={`group flex-shrink-0 rounded-2xl overflow-hidden glass-panel-interactive border border-slate-800/80 shadow-md hover:shadow-indigo-500/10 transition-all ${className}`}
    >
      <div className="relative w-full aspect-[2/3] bg-slate-900">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            {item.mediaType === 'movie' ? <Film className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-amber-300">
          <Star className="w-3 h-3 fill-amber-300" />
          {item.rating ? item.rating.toFixed(1) : '–'}
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-slate-100 truncate" title={item.title}>
          {item.title}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {item.mediaType === 'movie' ? 'Movie' : 'TV Series'}
          {year ? ` • ${year}` : ''}
        </p>
      </div>
    </Link>
  );
};
