import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { contentService } from '../services/content/ContentService';
import { watchSpaceService } from '../services/watchSpaceService';
import { useAuth } from '../context/AuthContext';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { HeroBanner } from '../components/media/HeroBanner';
import { MediaRow } from '../components/media/MediaRow';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Movie, TVSeries, MediaItem, WatchHistoryItem } from '../types';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { currentSpace, isLoading: isSpaceLoading, spaces } = useWatchSpace();

  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularSeries, setPopularSeries] = useState<TVSeries[]>([]);
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [trendingRes, moviesRes, seriesRes] = await Promise.all([
          contentService.getTrending(),
          contentService.getPopularMovies(),
          contentService.getPopularSeries(),
        ]);
        if (cancelled) return;
        setTrending(trendingRes);
        setPopularMovies(moviesRes);
        setPopularSeries(seriesRes);

        if (currentSpace) {
          const [watchlistRows, historyRows] = await Promise.all([
            watchSpaceService.listWatchlist(currentSpace.id),
            watchSpaceService.listWatchHistory(currentSpace.id),
          ]);
          if (cancelled) return;
          setContinueWatching(historyRows.slice(0, 10));

          const watchlistItems = await Promise.all(
            watchlistRows.slice(0, 20).map((w) =>
              w.mediaType === 'movie'
                ? contentService.getMovieDetails(w.tmdbId).catch(() => null)
                : contentService.getSeriesDetails(w.tmdbId).catch(() => null)
            )
          );
          if (cancelled) return;
          setWatchlist(watchlistItems.filter(Boolean) as MediaItem[]);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load content.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentSpace]);

  if (!isSpaceLoading && user && spaces.length === 0) {
    return <Navigate to="/spaces" replace />;
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (isLoading && trending.length === 0) {
    return (
      <div className="py-24">
        <LoadingState message="Loading VidSetu..." subMessage="Fetching trending movies and shows" size="lg" />
      </div>
    );
  }

  const hero = trending[0] ?? null;

  return (
    <div className="space-y-10 pb-12">
      <HeroBanner item={hero} />

      {continueWatching.length > 0 && (
        <ContinueWatchingRow items={continueWatching} />
      )}

      <MediaRow title="Trending Now" items={trending.slice(1, 21)} />
      <MediaRow title="Popular Movies" items={popularMovies} />
      <MediaRow title="Popular TV Shows" items={popularSeries} />
      <MediaRow
        title="My Watchlist"
        items={watchlist}
        emptyMessage="Nothing saved yet — add a movie or show from its details page."
      />
    </div>
  );
};

const ContinueWatchingRow: React.FC<{ items: WatchHistoryItem[] }> = ({ items }) => {
  const [resolved, setResolved] = useState<MediaItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      items.map((h) =>
        h.mediaType === 'movie'
          ? contentService.getMovieDetails(h.tmdbId).catch(() => null)
          : contentService.getSeriesDetails(h.tmdbId).catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) setResolved(results.filter(Boolean) as MediaItem[]);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  return <MediaRow title="Continue Watching" items={resolved} />;
};
