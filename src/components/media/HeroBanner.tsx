import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
import { MediaItem } from '../../types';

interface HeroBannerProps {
  item: MediaItem | null;
  isLoading?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item, isLoading }) => {
  if (isLoading || !item) {
    return <div className="w-full h-[32vh] sm:h-[46vh] md:h-[54vh] rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />;
  }

  const detailsHref = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
  const watchHref = item.mediaType === 'movie' ? `/watch/movie/${item.id}` : `/tv/${item.id}`;

  return (
    <section className="relative w-full h-[32vh] sm:h-[46vh] md:h-[54vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {item.backdropUrl && (
        <img src={item.backdropUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e17]/80 via-transparent to-transparent" />

      <div className="relative h-full flex flex-col justify-end p-4 sm:p-8 md:p-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1.5 sm:mb-3">
          <Star className="w-3 h-3 fill-amber-300" />
          {item.rating.toFixed(1)} Rating
        </div>

        <h1 className="text-xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
          {item.title}
        </h1>

        <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {item.overview}
        </p>

        <div className="mt-3 sm:mt-6 flex items-center gap-2.5 sm:gap-3">
          <Link
            to={watchHref}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm shadow-xl transition-all"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-900" />
            Play
          </Link>
          <Link
            to={detailsHref}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 backdrop-blur-sm transition-all"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            More Info
          </Link>
        </div>
      </div>
    </section>
  );
};
