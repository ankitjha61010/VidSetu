import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Genre, DiscoverFilters } from '../../types';

interface CategoryFilterBarProps {
  genres: Genre[];
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
}

const SORT_OPTIONS: { value: NonNullable<DiscoverFilters['sortBy']>; label: string }[] = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
];

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'Hollywood (English)' },
  { value: 'hi', label: 'Bollywood (Hindi)' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'es', label: 'Spanish' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - i);

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ genres, filters, onChange }) => {
  const hasActiveFilters = Boolean(
    filters.genreId || filters.year || filters.language || (filters.sortBy && filters.sortBy !== 'popularity.desc')
  );

  return (
    <div className="space-y-2">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onChange({ sortBy: 'popularity.desc' })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative w-full sm:w-auto">
          <select
            value={filters.genreId ?? ''}
            onChange={(e) => onChange({ ...filters, genreId: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-200 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filters.year ?? ''}
            onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
          >
            <option value="">Any Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-200 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filters.language ?? ''}
            onChange={(e) => onChange({ ...filters, language: e.target.value || undefined })}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
          >
            <option value="">All Industries</option>
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-200 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={filters.sortBy ?? 'popularity.desc'}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as DiscoverFilters['sortBy'] })}
            className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-200 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
};
