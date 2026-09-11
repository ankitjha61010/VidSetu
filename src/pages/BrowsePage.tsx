import React, { useEffect, useState } from 'react';
import { contentService } from '../services/content/ContentService';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { CategoryFilterBar } from '../components/media/CategoryFilterBar';
import { MediaCard } from '../components/media/MediaCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { DiscoverFilters, Genre, MediaItem } from '../types';

interface BrowsePageProps {
  mediaType: 'movie' | 'tv';
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ mediaType }) => {
  const { isKidsSpace } = useWatchSpace();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filters, setFilters] = useState<DiscoverFilters>({ sortBy: 'popularity.desc' });
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    contentService.getGenres(mediaType, isKidsSpace).then(setGenres);
  }, [mediaType, isKidsSpace]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setPage(1);
    const discover = mediaType === 'movie' ? contentService.discoverMovies : contentService.discoverSeries;
    discover({ ...filters, isKids: isKidsSpace, page: 1 })
      .then((res) => !cancelled && setItems(res))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mediaType, filters, isKidsSpace]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const discover = mediaType === 'movie' ? contentService.discoverMovies : contentService.discoverSeries;
      const res = await discover({ ...filters, isKids: isKidsSpace, page: nextPage });
      setItems((prev) => [...prev, ...res]);
      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const pageTitle = isKidsSpace
    ? mediaType === 'movie'
      ? 'Kids Movies'
      : 'Kids Cartoons & Shows'
    : mediaType === 'movie'
    ? 'Movies'
    : 'TV Shows';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {pageTitle}
        </h1>
        {isKidsSpace && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            👶 Kids Space
          </span>
        )}
      </div>

      <CategoryFilterBar genres={genres} filters={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingState message={`Loading ${mediaType === 'movie' ? 'movies' : 'TV shows'}...`} />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing found" description="Try a different genre, year, or industry filter." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} className="w-full" />
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-all disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
