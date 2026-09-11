import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { contentService } from '../services/content/ContentService';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { MediaCard } from '../components/media/MediaCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { SearchResult } from '../types';

export const SearchPage: React.FC = () => {
  const { isKidsSpace } = useWatchSpace();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    contentService
      .search(q, isKidsSpace)
      .then((res) => {
        if (!cancelled) setResults(res);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams, isKidsSpace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies and TV shows..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
        />
      </form>

      {isLoading ? (
        <LoadingState message="Searching..." />
      ) : !searchParams.get('q') ? (
        <EmptyState title="Search VidSetu" description="Find any movie or TV show by title." />
      ) : results.length === 0 ? (
        <EmptyState title="No results found" description={`Nothing matched "${searchParams.get('q')}".`} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {results.map((item) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
};
