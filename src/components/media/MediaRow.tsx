import React from 'react';
import { MediaItem } from '../../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  cardClassName?: string;
  aspectVariant?: 'poster' | 'landscape';
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  isLoading,
  emptyMessage,
  cardClassName,
  aspectVariant,
}) => {
  if (!isLoading && items.length === 0 && !emptyMessage) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-white px-1">{title}</h2>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 ${aspectVariant === 'landscape' ? 'aspect-[16/9]' : 'aspect-[2/3]'} rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse ${
                cardClassName || 'w-28 sm:w-32'
              }`}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 px-1">{emptyMessage}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 -mx-1 scroll-smooth snap-x">
          {items.map((item) => (
            <div key={`${item.mediaType}-${item.id}`} className="snap-start">
              <MediaCard item={item} className={cardClassName} aspectVariant={aspectVariant} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
